import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, Edit, ClipboardList, Plane, User, Clock, 
  DollarSign, AlertTriangle, CheckCircle, Plus, Wrench 
} from "lucide-react"

const statusColors: Record<string, string> = {
  draft: "badge-gray",
  open: "badge-warning",
  in_progress: "badge-info",
  pending_parts: "badge-warning",
  completed: "badge-success",
  invoiced: "badge-success",
  cancelled: "badge-danger",
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: {
      id: params.id,
      aircraft: { shopId },
    },
    include: {
      aircraft: true,
      customer: true,
      squawks: true,
      discrepancies: {
        include: {
          mechanic: true,
          workEntries: {
            include: { mechanic: true },
          },
          lineItems: true,
        },
        orderBy: { position: "asc" },
      },
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
      timesheetEntries: {
        include: { user: true },
        orderBy: { workDate: "desc" },
      },
      logbookEntries: {
        orderBy: { entryDate: "desc" },
      },
    },
  })

  if (!workOrder) {
    notFound()
  }

  // Calculate totals
  const laborHours = workOrder.timesheetEntries.reduce((sum, ts) => sum + ts.hours, 0)
  const laborItems = workOrder.lineItems.filter(li => li.itemType === "labor")
  const partsItems = workOrder.lineItems.filter(li => li.itemType === "parts")
  
  const laborTotal = laborItems.reduce((sum, li) => {
    return sum + (li.hours || 0) * (li.rate || 0)
  }, 0)
  
  const partsTotal = partsItems.reduce((sum, li) => {
    return sum + (li.quantity * (li.unitPrice || 0))
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/work-orders" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{workOrder.woNumber}</h1>
              <span className={`badge ${statusColors[workOrder.status]}`}>
                {workOrder.status.replace("_", " ")}
              </span>
              {workOrder.priority > 0 && (
                <span className="badge badge-danger">
                  {workOrder.priority === 2 ? "AOG" : "HIGH PRIORITY"}
                </span>
              )}
            </div>
            <p className="text-gray-500">{workOrder.title}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/work-orders/${workOrder.id}/edit`} className="btn btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button className="btn btn-primary">
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href={`/aircraft/${workOrder.aircraft.id}`} className="card hover:shadow-md">
          <div className="flex items-center">
            <Plane className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Aircraft</p>
              <p className="font-medium text-gray-900">{workOrder.aircraft.nNumber}</p>
            </div>
          </div>
        </Link>
        {workOrder.customer && (
          <Link href={`/customers/${workOrder.customer.id}`} className="card hover:shadow-md">
            <div className="flex items-center">
              <User className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{workOrder.customer.name}</p>
              </div>
            </div>
          </Link>
        )}
        <div className="card">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Labor Hours</p>
              <p className="font-medium text-gray-900">{laborHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium text-gray-900">
                ${(laborTotal + partsTotal).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Discrepancies & Work */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {workOrder.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{workOrder.description}</p>
            </div>
          )}

          {/* Discrepancies / Work Items */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Work Items</h2>
              <button className="btn btn-sm btn-secondary">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>
            {workOrder.discrepancies.length > 0 ? (
              <div className="space-y-4">
                {workOrder.discrepancies.map((disc, index) => (
                  <div key={disc.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h3 className="font-medium text-gray-900">{disc.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${
                            disc.workflowStatus === "complete" ? "badge-success" :
                            disc.workflowStatus === "in_progress" ? "badge-info" :
                            "badge-gray"
                          }`}>
                            {disc.workflowStatus}
                          </span>
                          {disc.mechanic && (
                            <span className="text-sm text-gray-500">
                              {disc.mechanic.firstName} {disc.mechanic.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                      {disc.notesInternal && (
                        <p className="text-sm text-gray-600 mt-2">{disc.notesInternal}</p>
                      )}
                    </div>
                    {disc.workEntries.length > 0 && (
                      <div className="p-4 space-y-2">
                        {disc.workEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              {entry.isComplete ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Wrench className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={entry.isComplete ? "text-gray-500 line-through" : "text-gray-900"}>
                                {entry.description}
                              </span>
                            </div>
                            {entry.timesheetHours > 0 && (
                              <span className="text-sm text-gray-500">{entry.timesheetHours}h</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No work items added yet</p>
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </button>
              </div>
            )}
          </div>

          {/* Squawks */}
          {workOrder.squawks.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Squawks</h2>
              <div className="space-y-3">
                {workOrder.squawks.map((sq) => (
                  <Link
                    key={sq.id}
                    href={`/squawks/${sq.id}`}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        sq.severity === "critical" ? "text-red-500" :
                        sq.severity === "major" ? "text-yellow-500" : "text-gray-400"
                      }`} />
                      <span className="text-gray-900">{sq.title}</span>
                    </div>
                    <span className={`badge ${
                      sq.status === "resolved" ? "badge-success" :
                      sq.status === "in_progress" ? "badge-info" :
                      "badge-warning"
                    }`}>
                      {sq.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right - Times, Financials, History */}
        <div className="space-y-6">
          {/* Aircraft Times */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Times</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Hobbs In</p>
                <p className="font-medium">{workOrder.hobbsIn || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hobbs Out</p>
                <p className="font-medium">{workOrder.hobbsOut || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tach In</p>
                <p className="font-medium">{workOrder.tachIn || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tach Out</p>
                <p className="font-medium">{workOrder.tachOut || "-"}</p>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financials</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Labor ({laborHours.toFixed(1)}h)</span>
                <span className="font-medium">${laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Parts</span>
                <span className="font-medium">${partsTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  ${(laborTotal + partsTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Entries */}
          <div className="card">
            <div className="card-header mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
              <Link href={`/timesheets/new?workOrder=${workOrder.id}`} className="text-sm text-primary-600">
                Log time →
              </Link>
            </div>
            {workOrder.timesheetEntries.length > 0 ? (
              <div className="space-y-3">
                {workOrder.timesheetEntries.slice(0, 5).map((ts) => (
                  <div key={ts.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-900">{ts.user.firstName} {ts.user.lastName}</p>
                      <p className="text-gray-500">{new Date(ts.workDate).toLocaleDateString()}</p>
                    </div>
                    <span className="font-medium">{ts.hours}h</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No time logged</p>
            )}
          </div>

          {/* Scheduling */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Scheduled Start</p>
                <p className="font-medium">
                  {workOrder.scheduledStart 
                    ? new Date(workOrder.scheduledStart).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled End</p>
                <p className="font-medium">
                  {workOrder.scheduledEnd 
                    ? new Date(workOrder.scheduledEnd).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{workOrder.assignedMechanic || "-"}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {workOrder.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{workOrder.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
