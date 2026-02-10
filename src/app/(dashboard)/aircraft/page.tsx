import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, Plane, Search } from "lucide-react"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { Pagination } from "@/components/ui/Pagination"

const PAGE_SIZE = 20

export default async function AircraftPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string; sort?: string; order?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, sort, order } = searchParams
  const page = parseInt(searchParams.page || "1")

  const where: any = {
    shopId,
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(q ? {
      OR: [
        { nNumber: { contains: q } },
        { manufacturer: { contains: q } },
        { model: { contains: q } },
        { registeredOwner: { contains: q } },
      ],
    } : {}),
  }

  const totalCount = await prisma.aircraft.count({ where })
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build orderBy
  const orderDir: "asc" | "desc" = order === "asc" ? "asc" : "desc"
  let orderBy: any = [{ nNumber: "asc" }]
  if (sort === "nNumber") orderBy = [{ nNumber: orderDir }]
  else if (sort === "manufacturer") orderBy = [{ manufacturer: orderDir }]
  else if (sort === "year") orderBy = [{ year: orderDir }]
  else if (sort === "baseAirport") orderBy = [{ baseAirport: orderDir }]

  const aircraft = await prisma.aircraft.findMany({
    where,
    include: {
      customer: true,
      _count: {
        select: {
          squawks: { where: { status: { in: ["open", "in_progress"] } } },
          workOrders: { where: { status: { in: ["open", "in_progress", "pending_parts"] } } },
        },
      },
    },
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const filterParams = { q, status, sort, order }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aircraft</h1>
          <p className="text-gray-500">{totalCount} aircraft in your shop</p>
        </div>
        <Link href="/aircraft/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Aircraft
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
                placeholder="Search N-number, make, model, owner..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="status" defaultValue={status} className="input w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Aircraft List */}
      <div className="card">
        {aircraft.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader label="N-Number" sortKey="nNumber" currentSort={sort} currentOrder={order} baseUrl="/aircraft" searchParams={filterParams} className="text-left" />
                    <SortableHeader label="Aircraft" sortKey="manufacturer" currentSort={sort} currentOrder={order} baseUrl="/aircraft" searchParams={filterParams} className="text-left" />
                    <SortableHeader label="Year" sortKey="year" currentSort={sort} currentOrder={order} baseUrl="/aircraft" searchParams={filterParams} className="text-left" />
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <SortableHeader label="Base" sortKey="baseAirport" currentSort={sort} currentOrder={order} baseUrl="/aircraft" searchParams={filterParams} className="text-left" />
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Squawks</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Work Orders</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraft.map((ac) => (
                    <tr key={ac.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/aircraft/${ac.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {ac.nNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Plane className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {ac.manufacturer} {ac.model}
                            </p>
                            {ac.serialNumber && (
                              <p className="text-sm text-gray-500">S/N: {ac.serialNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{ac.year || "-"}</td>
                      <td className="py-3 px-4 text-gray-600">{ac.registeredOwner || "-"}</td>
                      <td className="py-3 px-4">
                        {ac.customer ? (
                          <Link
                            href={`/customers/${ac.customer.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {ac.customer.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{ac.baseAirport || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        {ac._count.squawks > 0 ? (
                          <span className="badge badge-warning">{ac._count.squawks}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {ac._count.workOrders > 0 ? (
                          <span className="badge badge-info">{ac._count.workOrders}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${ac.isActive ? "badge-success" : "badge-gray"}`}>
                          {ac.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/aircraft"
              searchParams={filterParams}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No aircraft found</p>
            <Link href="/aircraft/new" className="btn btn-primary">
              Add your first aircraft
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
