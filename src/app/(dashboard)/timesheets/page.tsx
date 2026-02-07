import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, Clock, Search, Calendar, CheckCircle, XCircle, User } from "lucide-react"

const statusColors: Record<string, string> = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
}

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; startDate?: string; endDate?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId
  const userId = session?.user?.id
  const userRole = session?.user?.role

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, startDate, endDate } = searchParams

  // Parse date filters
  const startFilter = startDate ? new Date(startDate) : undefined
  const endFilter = endDate ? new Date(endDate) : undefined

  // Mechanics see their own, admins see all
  const userFilter = ["owner", "admin"].includes(userRole || "") ? {} : { userId }

  const timesheets = await prisma.timesheetEntry.findMany({
    where: {
      shopId,
      ...userFilter,
      ...(status ? { status } : {}),
      ...(startFilter ? { workDate: { gte: startFilter } } : {}),
      ...(endFilter ? { workDate: { lte: endFilter } } : {}),
      ...(q ? {
        OR: [
          { description: { contains: q } },
          { workOrder: { woNumber: { contains: q } } },
          { user: { firstName: { contains: q } } },
          { user: { lastName: { contains: q } } },
        ],
      } : {}),
    },
    include: {
      user: true,
      workOrder: { include: { aircraft: true } },
      approvedBy: true,
    },
    orderBy: [
      { workDate: "desc" },
      { createdAt: "desc" },
    ],
  })

  // Calculate totals
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0)
  const pendingCount = timesheets.filter(ts => ts.status === "pending").length
  const billableHours = timesheets
    .filter(ts => ts.isBillable && ts.status === "approved")
    .reduce((sum, ts) => sum + ts.hours, 0)

  // Group by date for display
  const groupedByDate = timesheets.reduce((acc, ts) => {
    const dateKey = new Date(ts.workDate).toLocaleDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(ts)
    return acc
  }, {} as Record<string, typeof timesheets>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-500">
            {totalHours.toFixed(1)} total hours • {billableHours.toFixed(1)} billable
            {pendingCount > 0 && ` • ${pendingCount} pending approval`}
          </p>
        </div>
        <Link href="/timesheets/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Log Time
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-900">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Billable</p>
              <p className="text-2xl font-bold text-green-900">{billableHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center">
            <User className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Entries</p>
              <p className="text-2xl font-bold text-gray-900">{timesheets.length}</p>
            </div>
          </div>
        </div>
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
                placeholder="Search description, WO#, user..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="input w-auto"
            placeholder="Start date"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="input w-auto"
            placeholder="End date"
          />
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Timesheet List */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="space-y-3">
                {entries.map((ts) => (
                  <div
                    key={ts.id}
                    className="card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`badge ${statusColors[ts.status]}`}>
                            {ts.status}
                          </span>
                          {ts.isBillable && (
                            <span className="badge badge-success">Billable</span>
                          )}
                          {ts.taskType && (
                            <span className="badge badge-gray">{ts.taskType}</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">
                          {ts.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{ts.user.firstName} {ts.user.lastName}</span>
                          {ts.workOrder && (
                            <Link
                              href={`/work-orders/${ts.workOrder.id}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              WO: {ts.workOrder.woNumber}
                            </Link>
                          )}
                          {ts.startTime && ts.endTime && (
                            <span>{ts.startTime} - {ts.endTime}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">{ts.hours}h</p>
                        {ts.rate && (
                          <p className="text-sm text-gray-500">
                            ${(ts.hours * ts.rate).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No timesheet entries found</p>
          <Link href="/timesheets/new" className="btn btn-primary">
            Log your first time entry
          </Link>
        </div>
      )}
    </div>
  )
}
