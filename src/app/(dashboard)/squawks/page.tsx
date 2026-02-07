import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, AlertTriangle, Search, Filter } from "lucide-react"

const severityColors: Record<string, string> = {
  minor: "badge-gray",
  major: "badge-warning",
  critical: "badge-danger",
}

const statusColors: Record<string, string> = {
  open: "badge-warning",
  in_progress: "badge-info",
  resolved: "badge-success",
  deferred: "badge-gray",
}

export default async function SquawksPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; severity?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, severity } = searchParams

  const squawks = await prisma.squawk.findMany({
    where: {
      aircraft: { shopId },
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { aircraft: { nNumber: { contains: q } } },
        ],
      } : {}),
    },
    include: {
      aircraft: true,
      workOrder: true,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  })

  const openCount = squawks.filter(s => s.status === "open").length
  const inProgressCount = squawks.filter(s => s.status === "in_progress").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squawks</h1>
          <p className="text-gray-500">
            {openCount} open, {inProgressCount} in progress
          </p>
        </div>
        <Link href="/squawks/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Squawk
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search squawks..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="deferred">Deferred</option>
          </select>
          <select name="severity" defaultValue={severity} className="input w-auto">
            <option value="">All Severity</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Squawks List */}
      <div className="space-y-4">
        {squawks.length > 0 ? (
          squawks.map((squawk) => (
            <Link
              key={squawk.id}
              href={`/squawks/${squawk.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${severityColors[squawk.severity]}`}>
                      {squawk.severity}
                    </span>
                    <span className={`badge ${statusColors[squawk.status]}`}>
                      {squawk.status.replace("_", " ")}
                    </span>
                    {squawk.priority > 0 && (
                      <span className="badge badge-danger">
                        {squawk.priority === 2 ? "URGENT" : "HIGH"}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{squawk.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-primary-600">{squawk.aircraft.nNumber}</span>
                    <span>{squawk.aircraft.manufacturer} {squawk.aircraft.model}</span>
                    {squawk.category && <span>• {squawk.category}</span>}
                  </div>
                  {squawk.description && (
                    <p className="text-gray-600 mt-2 line-clamp-2">{squawk.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-500">
                    {new Date(squawk.createdAt).toLocaleDateString()}
                  </p>
                  {squawk.workOrder && (
                    <p className="text-sm text-primary-600 mt-1">
                      WO: {squawk.workOrder.woNumber}
                    </p>
                  )}
                  {squawk.estimatedHours && (
                    <p className="text-sm text-gray-500 mt-1">
                      Est: {squawk.estimatedHours}h
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No squawks found</p>
            <Link href="/squawks/new" className="btn btn-primary">
              Report a squawk
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
