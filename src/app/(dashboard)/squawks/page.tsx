import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, AlertTriangle, Search, Filter } from "lucide-react"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { Pagination } from "@/components/ui/Pagination"

const PAGE_SIZE = 20

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
  searchParams: { q?: string; status?: string; severity?: string; aircraft?: string; page?: string; sort?: string; order?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, severity, aircraft, sort, order } = searchParams
  const page = parseInt(searchParams.page || "1")

  const where: any = {
    aircraft: { shopId },
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(aircraft ? { aircraftId: aircraft } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { aircraft: { nNumber: { contains: q } } },
        { category: { contains: q } },
      ],
    } : {}),
  }

  const totalCount = await prisma.squawk.count({ where })
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build orderBy
  const orderDir: "asc" | "desc" = order === "asc" ? "asc" : "desc"
  let orderBy: any = [{ priority: "desc" }, { createdAt: "desc" }]
  if (sort === "title") orderBy = [{ title: orderDir }]
  else if (sort === "severity") orderBy = [{ severity: orderDir }]
  else if (sort === "status") orderBy = [{ status: orderDir }]
  else if (sort === "createdAt") orderBy = [{ createdAt: orderDir }]

  const squawks = await prisma.squawk.findMany({
    where,
    include: {
      aircraft: true,
      workOrder: true,
    },
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  // Get aircraft list for filter dropdown
  const aircraftList = await prisma.aircraft.findMany({
    where: { shopId, isActive: true },
    select: { id: true, nNumber: true },
    orderBy: { nNumber: "asc" },
  })

  // Count stats (unfiltered)
  const [openCount, inProgressCount, criticalCount] = await Promise.all([
    prisma.squawk.count({ where: { aircraft: { shopId }, status: "open" } }),
    prisma.squawk.count({ where: { aircraft: { shopId }, status: "in_progress" } }),
    prisma.squawk.count({ where: { aircraft: { shopId }, severity: "critical", status: { in: ["open", "in_progress"] } } }),
  ])

  const filterParams = { q, status, severity, aircraft, sort, order }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Squawks</h1>
          <p className="text-gray-500">
            {openCount} open, {inProgressCount} in progress
            {criticalCount > 0 && <span className="text-red-600 font-medium"> • {criticalCount} critical</span>}
          </p>
        </div>
        <Link href="/squawks/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Report Squawk
        </Link>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">
                {criticalCount} critical squawk{criticalCount > 1 ? "s" : ""} requiring immediate attention
              </p>
              <Link
                href="/squawks?severity=critical&status=open"
                className="text-sm text-red-600 hover:text-red-700"
              >
                View critical squawks →
              </Link>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Search squawks, aircraft..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="aircraft" defaultValue={aircraft} className="input w-auto">
            <option value="">All Aircraft</option>
            {aircraftList.map((ac) => (
              <option key={ac.id} value={ac.id}>{ac.nNumber}</option>
            ))}
          </select>
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

      {/* Squawks Table */}
      <div className="card">
        {squawks.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Aircraft</th>
                    <SortableHeader label="Squawk" sortKey="title" currentSort={sort} currentOrder={order} baseUrl="/squawks" searchParams={filterParams} className="text-left" />
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <SortableHeader label="Severity" sortKey="severity" currentSort={sort} currentOrder={order} baseUrl="/squawks" searchParams={filterParams} className="text-center" />
                    <SortableHeader label="Status" sortKey="status" currentSort={sort} currentOrder={order} baseUrl="/squawks" searchParams={filterParams} className="text-center" />
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Work Order</th>
                    <SortableHeader label="Reported" sortKey="createdAt" currentSort={sort} currentOrder={order} baseUrl="/squawks" searchParams={filterParams} className="text-left" />
                  </tr>
                </thead>
                <tbody>
                  {squawks.map((squawk) => (
                    <tr key={squawk.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/aircraft/${squawk.aircraft.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {squawk.aircraft.nNumber}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {squawk.aircraft.manufacturer} {squawk.aircraft.model}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/squawks/${squawk.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {squawk.title}
                        </Link>
                        {squawk.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                            {squawk.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {squawk.category || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${severityColors[squawk.severity]}`}>
                          {squawk.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${statusColors[squawk.status]}`}>
                          {squawk.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {squawk.priority > 0 && (
                          <span className="badge badge-danger">
                            {squawk.priority === 2 ? "URGENT" : "HIGH"}
                          </span>
                        )}
                        {squawk.priority === 0 && <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        {squawk.workOrder ? (
                          <Link
                            href={`/work-orders/${squawk.workOrder.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            {squawk.workOrder.woNumber}
                          </Link>
                        ) : (
                          <Link
                            href={`/work-orders/new?aircraft=${squawk.aircraftId}&squawk=${squawk.id}`}
                            className="text-xs text-gray-400 hover:text-primary-600"
                          >
                            + Create WO
                          </Link>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(squawk.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/squawks"
              searchParams={filterParams}
            />
          </>
        ) : (
          <div className="text-center py-12">
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
