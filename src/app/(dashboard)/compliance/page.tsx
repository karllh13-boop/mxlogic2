import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, FileCheck, Search, AlertTriangle, Calendar, CheckCircle } from "lucide-react"

const statusColors: Record<string, string> = {
  open: "badge-danger",
  complied: "badge-success",
  not_applicable: "badge-gray",
  recurring: "badge-info",
}

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; aircraft?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, status, aircraft } = searchParams

  // Get aircraft for filter dropdown
  const aircraftList = await prisma.aircraft.findMany({
    where: { shopId, isActive: true },
    select: { id: true, nNumber: true },
    orderBy: { nNumber: "asc" },
  })

  const adCompliance = await prisma.aDCompliance.findMany({
    where: {
      aircraft: { shopId },
      ...(status ? { status } : {}),
      ...(aircraft ? { aircraftId: aircraft } : {}),
      ...(q ? {
        OR: [
          { adNumber: { contains: q } },
          { adTitle: { contains: q } },
          { aircraft: { nNumber: { contains: q } } },
        ],
      } : {}),
    },
    include: {
      aircraft: true,
      workOrder: true,
    },
    orderBy: [
      { status: "asc" }, // Open first
      { nextDueDate: "asc" },
    ],
  })

  // Calculate stats
  const openCount = adCompliance.filter(ad => ad.status === "open").length
  const recurringCount = adCompliance.filter(ad => ad.status === "recurring").length
  
  // Check for upcoming due items (within 30 days or 50 hours)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const upcomingDue = adCompliance.filter(ad => {
    if (ad.status !== "recurring") return false
    if (ad.nextDueDate && ad.nextDueDate <= thirtyDaysFromNow) return true
    // TODO: Check hours-based due dates against current aircraft hours
    return false
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AD Compliance</h1>
          <p className="text-gray-500">
            {openCount} open • {recurringCount} recurring
          </p>
        </div>
        <Link href="/compliance/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add AD
        </Link>
      </div>

      {/* Alerts */}
      {openCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">
                {openCount} Airworthiness Directives require compliance
              </p>
              <Link 
                href="/compliance?status=open" 
                className="text-sm text-red-600 hover:text-red-700"
              >
                View open ADs →
              </Link>
            </div>
          </div>
        </div>
      )}

      {upcomingDue.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">
                {upcomingDue.length} recurring ADs due within 30 days
              </p>
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
                placeholder="Search AD number, title..."
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
            <option value="complied">Complied</option>
            <option value="recurring">Recurring</option>
            <option value="not_applicable">N/A</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* AD List */}
      <div className="space-y-4">
        {adCompliance.length > 0 ? (
          adCompliance.map((ad) => {
            const isDue = ad.status === "recurring" && ad.nextDueDate && ad.nextDueDate <= thirtyDaysFromNow
            
            return (
              <div
                key={ad.id}
                className={`card ${ad.status === "open" ? "border-red-200 bg-red-50" : isDue ? "border-yellow-200 bg-yellow-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${statusColors[ad.status]}`}>
                        {ad.status === "not_applicable" ? "N/A" : ad.status}
                      </span>
                      <Link
                        href={`/aircraft/${ad.aircraft.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {ad.aircraft.nNumber}
                      </Link>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      AD {ad.adNumber}
                    </h3>
                    {ad.adTitle && (
                      <p className="text-gray-600 mb-2">{ad.adTitle}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {ad.complianceDate && (
                        <span className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          Complied: {new Date(ad.complianceDate).toLocaleDateString()}
                        </span>
                      )}
                      {ad.complianceHours && (
                        <span>@ {ad.complianceHours} hrs</span>
                      )}
                      {ad.methodOfCompliance && (
                        <span>Method: {ad.methodOfCompliance}</span>
                      )}
                      {ad.workOrder && (
                        <Link
                          href={`/work-orders/${ad.workOrder.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          WO: {ad.workOrder.woNumber}
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Next Due */}
                  {ad.status === "recurring" && (
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">Next Due</p>
                      {ad.nextDueDate && (
                        <p className={`font-medium ${isDue ? "text-red-600" : "text-gray-900"}`}>
                          {new Date(ad.nextDueDate).toLocaleDateString()}
                        </p>
                      )}
                      {ad.nextDueHours && (
                        <p className="text-sm text-gray-600">
                          or {ad.nextDueHours} hrs
                        </p>
                      )}
                      {ad.intervalMonths && (
                        <p className="text-xs text-gray-400">
                          Every {ad.intervalMonths} months
                        </p>
                      )}
                      {ad.intervalHours && (
                        <p className="text-xs text-gray-400">
                          Every {ad.intervalHours} hrs
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="card text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No AD compliance records found</p>
            <Link href="/compliance/new" className="btn btn-primary">
              Add your first AD
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
