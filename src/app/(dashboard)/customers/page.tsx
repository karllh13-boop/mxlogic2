import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, Users, Search, Mail, Phone, MapPin } from "lucide-react"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q } = searchParams

  const customers = await prisma.customer.findMany({
    where: {
      shopId,
      isActive: true,
      ...(q ? {
        OR: [
          { name: { contains: q } },
          { contactName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      } : {}),
    },
    include: {
      _count: {
        select: {
          aircraft: true,
          workOrders: { where: { status: { in: ["open", "in_progress", "pending_parts"] } } },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer relationships</p>
        </div>
        <Link href="/customers/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <form className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search customers..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Customer Grid */}
      {customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex gap-2">
                  <span className="badge badge-info">{customer._count.aircraft} aircraft</span>
                  {customer._count.workOrders > 0 && (
                    <span className="badge badge-warning">{customer._count.workOrders} active WO</span>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{customer.name}</h3>
              {customer.contactName && (
                <p className="text-sm text-gray-500 mb-3">{customer.contactName}</p>
              )}
              
              <div className="space-y-2 text-sm text-gray-600">
                {customer.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {customer.phone}
                  </div>
                )}
                {customer.city && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {customer.city}, {customer.state}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No customers found</p>
          <Link href="/customers/new" className="btn btn-primary">
            Add your first customer
          </Link>
        </div>
      )}
    </div>
  )
}
