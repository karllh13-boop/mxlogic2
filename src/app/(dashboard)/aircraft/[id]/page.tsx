import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Edit, Plane, User, AlertTriangle, ClipboardList, 
  Settings, FileCheck, Calendar, Clock, Gauge 
} from "lucide-react"

export default async function AircraftDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const aircraft = await prisma.aircraft.findFirst({
    where: {
      id: params.id,
      shopId,
    },
    include: {
      customer: true,
      timers: true,
      equipment: true,
      squawks: {
        where: { status: { in: ["open", "in_progress"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      },
      adCompliance: {
        where: { status: { in: ["open", "recurring"] } },
        orderBy: { nextDueDate: "asc" },
        take: 5,
      },
    },
  })

  if (!aircraft) {
    notFound()
  }

  // Get primary timers
  const hobbsTimer = aircraft.timers.find(t => t.timerType === "HOBBS")
  const tachTimer = aircraft.timers.find(t => t.timerType === "TACH")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/aircraft" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Plane className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{aircraft.nNumber}</h1>
            <p className="text-gray-500">
              {aircraft.year} {aircraft.manufacturer} {aircraft.model}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/aircraft/${aircraft.id}/edit`} className="btn btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <Link href={`/work-orders/new?aircraft=${aircraft.id}`} className="btn btn-primary">
            <ClipboardList className="w-4 h-4 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-3">
        <span className={`badge ${aircraft.isActive ? "badge-success" : "badge-gray"}`}>
          {aircraft.isActive ? "Active" : "Inactive"}
        </span>
        {aircraft.squawks.length > 0 && (
          <span className="badge badge-warning">
            {aircraft.squawks.length} Open Squawks
          </span>
        )}
        {aircraft.adCompliance.filter(ad => ad.status === "open").length > 0 && (
          <span className="badge badge-danger">
            {aircraft.adCompliance.filter(ad => ad.status === "open").length} Open ADs
          </span>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aircraft Details Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">N-Number</p>
                <p className="font-medium">{aircraft.nNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-medium">{aircraft.serialNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manufacturer</p>
                <p className="font-medium">{aircraft.manufacturer || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{aircraft.model || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium">{aircraft.year || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Voltage</p>
                <p className="font-medium">{aircraft.voltage || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Base Airport</p>
                <p className="font-medium">{aircraft.baseAirport || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type Certificate</p>
                <p className="font-medium">{aircraft.typeCertificate || "-"}</p>
              </div>
            </div>
          </div>

          {/* Ownership Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Registered Owner</p>
                <p className="font-medium">{aircraft.registeredOwner || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Registered Address</p>
                <p className="font-medium">{aircraft.registeredAddress || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                {aircraft.customer ? (
                  <Link 
                    href={`/customers/${aircraft.customer.id}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {aircraft.customer.name}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-400">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Equipment Card */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
              <Link href={`/aircraft/${aircraft.id}/equipment`} className="text-sm text-primary-600">
                Manage →
              </Link>
            </div>
            {aircraft.equipment.length > 0 ? (
              <div className="space-y-3">
                {aircraft.equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {eq.equipmentType} {eq.position && `(${eq.position})`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {eq.manufacturer} {eq.model} • S/N: {eq.serialNumber || "N/A"}
                      </p>
                    </div>
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No equipment added</p>
            )}
          </div>

          {/* Recent Work Orders */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Work Orders</h2>
              <Link href={`/work-orders?aircraft=${aircraft.id}`} className="text-sm text-primary-600">
                View all →
              </Link>
            </div>
            {aircraft.workOrders.length > 0 ? (
              <div className="space-y-3">
                {aircraft.workOrders.map((wo) => (
                  <Link 
                    key={wo.id}
                    href={`/work-orders/${wo.id}`}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{wo.woNumber}</p>
                      <p className="text-sm text-gray-500">{wo.title}</p>
                    </div>
                    <span className={`badge ${
                      wo.status === "completed" ? "badge-success" :
                      wo.status === "in_progress" ? "badge-info" :
                      "badge-warning"
                    }`}>
                      {wo.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No work orders</p>
            )}
          </div>
        </div>

        {/* Right column - Timers, Squawks, ADs */}
        <div className="space-y-6">
          {/* Timers Card */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Timers</h2>
              <Link href={`/aircraft/${aircraft.id}/timers`} className="text-sm text-primary-600">
                Update →
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Hobbs</span>
                </div>
                <span className="text-xl font-bold text-blue-900">
                  {hobbsTimer?.currentValue.toFixed(1) || "0.0"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Gauge className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Tach</span>
                </div>
                <span className="text-xl font-bold text-green-900">
                  {tachTimer?.currentValue.toFixed(1) || "0.0"}
                </span>
              </div>
            </div>
          </div>

          {/* Open Squawks */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Open Squawks</h2>
              <Link href={`/squawks?aircraft=${aircraft.id}`} className="text-sm text-primary-600">
                View all →
              </Link>
            </div>
            {aircraft.squawks.length > 0 ? (
              <div className="space-y-3">
                {aircraft.squawks.map((sq) => (
                  <Link 
                    key={sq.id}
                    href={`/squawks/${sq.id}`}
                    className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${
                        sq.severity === "critical" ? "badge-danger" :
                        sq.severity === "major" ? "badge-warning" : "badge-gray"
                      }`}>
                        {sq.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{sq.title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No open squawks 🎉</p>
              </div>
            )}
          </div>

          {/* AD Compliance */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">AD Compliance</h2>
              <Link href={`/compliance?aircraft=${aircraft.id}`} className="text-sm text-primary-600">
                View all →
              </Link>
            </div>
            {aircraft.adCompliance.length > 0 ? (
              <div className="space-y-3">
                {aircraft.adCompliance.map((ad) => (
                  <div key={ad.id} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${
                        ad.status === "open" ? "badge-danger" : "badge-info"
                      }`}>
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">AD {ad.adNumber}</p>
                    {ad.nextDueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(ad.nextDueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">All ADs complied</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {aircraft.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{aircraft.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
