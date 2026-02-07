import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Edit, Users, Mail, Phone, MapPin, 
  Plane, ClipboardList, DollarSign 
} from "lucide-react"

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: params.id,
      shopId,
    },
    include: {
      aircraft: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              squawks: { where: { status: { in: ["open", "in_progress"] } } },
            },
          },
        },
      },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { aircraft: true },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  // Calculate stats
  const totalWorkOrders = customer.workOrders.length
  const activeWorkOrders = customer.workOrders.filter(
    wo => ["open", "in_progress", "pending_parts"].includes(wo.status)
  ).length
  const completedWorkOrders = customer.workOrders.filter(
    wo => wo.status === "completed" || wo.status === "invoiced"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/customers" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            {customer.contactName && (
              <p className="text-gray-500">{customer.contactName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/customers/${customer.id}/edit`} className="btn btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <Link href={`/work-orders/new?customer=${customer.id}`} className="btn btn-primary">
            <ClipboardList className="w-4 h-4 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Plane className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Aircraft</p>
              <p className="text-2xl font-bold text-blue-900">{customer.aircraft.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <ClipboardList className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Total WOs</p>
              <p className="text-2xl font-bold text-purple-900">{totalWorkOrders}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <ClipboardList className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Active</p>
              <p className="text-2xl font-bold text-yellow-900">{activeWorkOrders}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{completedWorkOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Contact Info & Aircraft */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-primary-600 hover:text-primary-700">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-primary-600 hover:text-primary-700">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {customer.address && <span>{customer.address}<br /></span>}
                      {customer.city && `${customer.city}, `}
                      {customer.state} {customer.zipCode}
                      {customer.country && customer.country !== "USA" && <br />}
                      {customer.country && customer.country !== "USA" && customer.country}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Aircraft */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Aircraft</h2>
              <Link href={`/aircraft/new?customer=${customer.id}`} className="text-sm text-primary-600">
                Add Aircraft →
              </Link>
            </div>
            {customer.aircraft.length > 0 ? (
              <div className="space-y-3">
                {customer.aircraft.map((ac) => (
                  <Link
                    key={ac.id}
                    href={`/aircraft/${ac.id}`}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                        <Plane className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{ac.nNumber}</p>
                        <p className="text-sm text-gray-500">
                          {ac.year} {ac.manufacturer} {ac.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ac._count.squawks > 0 && (
                        <span className="badge badge-warning">{ac._count.squawks} squawks</span>
                      )}
                      <span className="badge badge-success">Active</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No aircraft assigned</p>
                <Link href={`/aircraft/new?customer=${customer.id}`} className="btn btn-primary">
                  Add Aircraft
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right - Work Orders & Notes */}
        <div className="space-y-6">
          {/* Recent Work Orders */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Work Orders</h2>
              <Link href={`/work-orders?customer=${customer.id}`} className="text-sm text-primary-600">
                View all →
              </Link>
            </div>
            {customer.workOrders.length > 0 ? (
              <div className="space-y-3">
                {customer.workOrders.slice(0, 5).map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{wo.woNumber}</span>
                      <span className={`badge ${
                        wo.status === "completed" || wo.status === "invoiced" ? "badge-success" :
                        wo.status === "in_progress" ? "badge-info" :
                        "badge-warning"
                      }`}>
                        {wo.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {wo.aircraft.nNumber} - {wo.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(wo.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No work orders yet</p>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link 
                href={`/work-orders/new?customer=${customer.id}`}
                className="btn btn-secondary w-full justify-start"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Create Work Order
              </Link>
              <Link 
                href={`/aircraft/new?customer=${customer.id}`}
                className="btn btn-secondary w-full justify-start"
              >
                <Plane className="w-4 h-4 mr-2" />
                Add Aircraft
              </Link>
              {customer.email && (
                <a 
                  href={`mailto:${customer.email}`}
                  className="btn btn-secondary w-full justify-start"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
