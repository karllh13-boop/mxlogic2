import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, ClipboardList, Search, Filter, Calendar } from "lucide-react"
import { Pagination } from "@/components/ui/Pagination"
import { SortableHeader } from "@/components/ui/SortableHeader"

const PAGE_SIZE = 20

const statusColors: Record<string, string> = {
  draft: "badge-gray",
  open: "badge-warning",
  in_progress: "badge-info",
  pending_parts: "badge-warning",
  completed: "badge-success",
  invoiced: "badge-success",
  cancelled: "badge-danger",
}

const workTypeLabels: Record<string, string> = {
  annual: "Annual Inspection",
  "100hr": "100 Hour",
  unscheduled: "Unscheduled",
  squawk: "Squawk Repair",
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; page?: string; sort?: string; order?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, type, sort, order } = searchParams
  const page = parseInt(searchParams.page || "1")

  const where: any = {
    aircraft: { shopId },
  }
  if (status) where.status = status
  if (type) where.workType = type
  if (q) {
    where.OR = [
      { woNumber: { contains: q } },
      { title: { contains: q } },
      { aircraft: { nNumber: { contains: q } } },
      { customer: { name: { contains: q } } },
    ]
  }

  // Count total for pagination
  const totalCount = await prisma.workOrder.count({ where })
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build orderBy
  const orderDir: "asc" | "desc" = order === "asc" ? "asc" : "desc"
  let orderBy: any = [{ priority: "desc" }, { updatedAt: "desc" }]
  if (sort === "woNumber") orderBy = [{ woNumber: orderDir }]
  else if (sort === "status") orderBy = [{ status: orderDir }]
  else if (sort === "updatedAt") orderBy = [{ updatedAt: orderDir }]
  else if (sort === "title") orderBy = [{ title: orderDir }]

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      aircraft: true,
      customer: true,
      _count: {
        select: {
          squawks: true,
          discrepancies: true,
        },
      },
    },
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  // Get active count (unfiltered)
  const activeCount = await prisma.workOrder.count({
    where: {
      aircraft: { shopId },
      status: { in: ["open", "in_progress", "pending_parts"] },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-500">{activeCount} active work orders</p>
        </div>
        <Link href="/work-orders/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Work Order
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
                placeholder="Search WO#, aircraft, customer..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_parts">Pending Parts</option>
            <option value="completed">Completed</option>
            <option value="invoiced">Invoiced</option>
          </select>
          <select name="type" defaultValue={type} className="input w-auto">
            <option value="">All Types</option>
            <option value="annual">Annual</option>
            <option value="100hr">100 Hour</option>
            <option value="unscheduled">Unscheduled</option>
            <option value="squawk">Squawk</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Work Orders List */}
      <div className="card">
        {workOrders.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <SortableHeader label="WO #" sortKey="woNumber" currentSort={sort} currentOrder={order} baseUrl="/work-orders" searchParams={{ q, status, type }} className="text-left" />
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Aircraft</th>
                  <SortableHeader label="Title" sortKey="title" currentSort={sort} currentOrder={order} baseUrl="/work-orders" searchParams={{ q, status, type }} className="text-left" />
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Items</th>
                  <SortableHeader label="Status" sortKey="status" currentSort={sort} currentOrder={order} baseUrl="/work-orders" searchParams={{ q, status, type }} className="text-center" />
                  <SortableHeader label="Updated" sortKey="updatedAt" currentSort={sort} currentOrder={order} baseUrl="/work-orders" searchParams={{ q, status, type }} className="text-left" />
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {wo.woNumber}
                      </Link>
                      {wo.priority > 0 && (
                        <span className="ml-2 badge badge-danger text-xs">
                          {wo.priority === 2 ? "AOG" : "HIGH"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/aircraft/${wo.aircraft.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {wo.aircraft.nNumber}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {wo.aircraft.manufacturer} {wo.aircraft.model}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 line-clamp-1">{wo.title}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wo.workType ? workTypeLabels[wo.workType] || wo.workType : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {wo.customer ? (
                        <Link
                          href={`/customers/${wo.customer.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {wo.customer.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-600">
                        {wo._count.discrepancies} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${statusColors[wo.status]}`}>
                        {wo.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(wo.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/work-orders"
            searchParams={{ q, status, type, sort, order }}
          />
          </>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No work orders found</p>
            <Link href="/work-orders/new" className="btn btn-primary">
              Create your first work order
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
