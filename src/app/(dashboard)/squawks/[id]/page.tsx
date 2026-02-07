import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Edit, AlertTriangle, Plane, ClipboardList, 
  CheckCircle, Clock, User, DollarSign 
} from "lucide-react"

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

export default async function SquawkDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const squawk = await prisma.squawk.findFirst({
    where: {
      id: params.id,
      aircraft: { shopId },
    },
    include: {
      aircraft: true,
      workOrder: {
        include: { customer: true },
      },
    },
  })

  if (!squawk) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/squawks" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{squawk.title}</h1>
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/squawks/${squawk.id}/edit`} className="btn btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          {squawk.status !== "resolved" && (
            <button className="btn btn-success">
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve
            </button>
          )}
          {!squawk.workOrderId && (
            <Link 
              href={`/work-orders/new?aircraft=${squawk.aircraftId}&squawk=${squawk.id}`}
              className="btn btn-primary"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Create Work Order
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            {squawk.description ? (
              <p className="text-gray-600 whitespace-pre-wrap">{squawk.description}</p>
            ) : (
              <p className="text-gray-400 italic">No description provided</p>
            )}
          </div>

          {/* Categorization */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorization</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{squawk.category || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ATA Chapter</p>
                <p className="font-medium">{squawk.ataChapter || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reported By</p>
                <p className="font-medium">{squawk.reportedBy || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{squawk.assignedTo || "-"}</p>
              </div>
            </div>
          </div>

          {/* Resolution */}
          {squawk.status === "resolved" && (
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-green-900">Resolution</h2>
              </div>
              <div className="space-y-3">
                {squawk.resolvedDate && (
                  <div>
                    <p className="text-sm text-green-700">Resolved On</p>
                    <p className="font-medium text-green-900">
                      {new Date(squawk.resolvedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {squawk.resolutionNotes && (
                  <div>
                    <p className="text-sm text-green-700">Resolution Notes</p>
                    <p className="font-medium text-green-900 whitespace-pre-wrap">
                      {squawk.resolutionNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Linked Work Order */}
          {squawk.workOrder && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked Work Order</h2>
              <Link
                href={`/work-orders/${squawk.workOrder.id}`}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{squawk.workOrder.woNumber}</p>
                  <p className="text-sm text-gray-500">{squawk.workOrder.title}</p>
                </div>
                <span className={`badge ${
                  squawk.workOrder.status === "completed" ? "badge-success" :
                  squawk.workOrder.status === "in_progress" ? "badge-info" :
                  "badge-warning"
                }`}>
                  {squawk.workOrder.status.replace("_", " ")}
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Right - Aircraft, Estimates, Timeline */}
        <div className="space-y-6">
          {/* Aircraft */}
          <Link href={`/aircraft/${squawk.aircraft.id}`} className="card block hover:shadow-md">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aircraft</p>
                <p className="font-medium text-gray-900">{squawk.aircraft.nNumber}</p>
                <p className="text-sm text-gray-500">
                  {squawk.aircraft.manufacturer} {squawk.aircraft.model}
                </p>
              </div>
            </div>
          </Link>

          {/* Estimates */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimates</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Labor Hours</span>
                </div>
                <span className="font-medium">
                  {squawk.estimatedHours ? `${squawk.estimatedHours}h` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Estimated Cost</span>
                </div>
                <span className="font-medium">
                  {squawk.estimatedCost ? `$${squawk.estimatedCost.toFixed(2)}` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Parts Needed */}
          {squawk.partsNeeded && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Parts Needed</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{squawk.partsNeeded}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {new Date(squawk.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">
                  {new Date(squawk.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {squawk.resolvedDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Resolved</span>
                  <span className="font-medium text-green-600">
                    {new Date(squawk.resolvedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {squawk.status === "open" && (
                <button className="btn btn-secondary w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Assign Mechanic
                </button>
              )}
              {squawk.status === "open" && (
                <button className="btn btn-secondary w-full justify-start">
                  Start Work
                </button>
              )}
              {squawk.status !== "deferred" && squawk.status !== "resolved" && (
                <button className="btn btn-outline w-full justify-start text-gray-600">
                  Defer Squawk
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
