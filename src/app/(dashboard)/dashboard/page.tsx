import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Plane, Users, AlertTriangle, ClipboardList, Package, Clock, DollarSign, Activity } from "lucide-react"
import Link from "next/link"

async function getStats(shopId: string) {
  const [
    aircraftCount,
    customerCount,
    openSquawks,
    activeWorkOrders,
    pendingTimesheets,
    partsCount,
  ] = await Promise.all([
    prisma.aircraft.count({ where: { shopId, isActive: true } }),
    prisma.customer.count({ where: { shopId, isActive: true } }),
    prisma.squawk.count({
      where: {
        aircraft: { shopId },
        status: { in: ["open", "in_progress"] },
      },
    }),
    prisma.workOrder.count({
      where: {
        aircraft: { shopId },
        status: { in: ["open", "in_progress", "pending_parts"] },
      },
    }),
    prisma.timesheetEntry.count({
      where: { shopId, status: "pending" },
    }),
    prisma.part.count({ where: { shopId, isActive: true } }),
  ])

  // Count low stock parts
  const parts = await prisma.part.findMany({
    where: { shopId, isActive: true },
    include: { inventoryItems: { where: { isActive: true } } },
  })
  const lowStockParts = parts.filter(p => {
    const qty = p.inventoryItems.reduce((sum, i) => sum + i.quantity, 0)
    return qty < p.minQuantity
  }).length

  return { aircraftCount, customerCount, openSquawks, activeWorkOrders, pendingTimesheets, partsCount, lowStockParts }
}

async function getRecentActivity(shopId: string) {
  // Get recent work orders, squawks, and timesheets combined
  const [recentWOs, recentSquawks, recentTimesheets] = await Promise.all([
    prisma.workOrder.findMany({
      where: { aircraft: { shopId } },
      include: { aircraft: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.squawk.findMany({
      where: { aircraft: { shopId } },
      include: { aircraft: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.timesheetEntry.findMany({
      where: { shopId },
      include: { user: true, workOrder: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])
  return { recentWOs, recentSquawks, recentTimesheets }
}

async function getRecentWorkOrders(shopId: string) {
  return prisma.workOrder.findMany({
    where: { aircraft: { shopId } },
    include: { aircraft: true, customer: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })
}

async function getOpenSquawks(shopId: string) {
  return prisma.squawk.findMany({
    where: {
      aircraft: { shopId },
      status: { in: ["open", "in_progress"] },
    },
    include: { aircraft: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })
}

export default async function DashboardPage() {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const [stats, recentWorkOrders, openSquawks, activity] = await Promise.all([
    getStats(shopId),
    getRecentWorkOrders(shopId),
    getOpenSquawks(shopId),
    getRecentActivity(shopId),
  ])

  const statCards = [
    { name: "Aircraft", value: stats.aircraftCount, icon: Plane, href: "/aircraft", color: "bg-blue-500" },
    { name: "Customers", value: stats.customerCount, icon: Users, href: "/customers", color: "bg-green-500" },
    { name: "Open Squawks", value: stats.openSquawks, icon: AlertTriangle, href: "/squawks", color: "bg-yellow-500", alert: stats.openSquawks > 0 },
    { name: "Active WOs", value: stats.activeWorkOrders, icon: ClipboardList, href: "/work-orders", color: "bg-purple-500" },
    { name: "Pending Time", value: stats.pendingTimesheets, icon: Clock, href: "/timesheets?status=pending", color: "bg-indigo-500", alert: stats.pendingTimesheets > 0 },
    { name: "Low Stock", value: stats.lowStockParts, icon: Package, href: "/parts?lowStock=true", color: "bg-red-500", alert: stats.lowStockParts > 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {session?.user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/work-orders/new" className="btn btn-primary btn-sm">
            <ClipboardList className="w-4 h-4 mr-1" />
            New WO
          </Link>
          <Link href="/squawks/new" className="btn btn-secondary btn-sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Report Squawk
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className={`card hover:shadow-md transition-shadow ${stat.alert ? 'ring-2 ring-yellow-300' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              {stat.alert && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.name}</p>
          </Link>
        ))}
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Work Orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent Work Orders</h2>
            <Link href="/work-orders" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {recentWorkOrders.length > 0 ? (
            <div className="space-y-3">
              {recentWorkOrders.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">{wo.woNumber}</span>
                    <span className={`badge ${
                      wo.status === "completed" || wo.status === "invoiced" ? "badge-success" :
                      wo.status === "in_progress" ? "badge-info" :
                      wo.status === "pending_parts" ? "badge-warning" :
                      wo.status === "cancelled" ? "badge-danger" :
                      "badge-gray"
                    }`}>
                      {wo.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{wo.aircraft.nNumber} — {wo.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No work orders yet</p>
          )}
        </div>

        {/* Open Squawks */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Open Squawks</h2>
            <Link href="/squawks" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {openSquawks.length > 0 ? (
            <div className="space-y-3">
              {openSquawks.map((squawk) => (
                <Link
                  key={squawk.id}
                  href={`/squawks/${squawk.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-primary-600">{squawk.aircraft.nNumber}</span>
                    <span className={`badge ${
                      squawk.severity === "critical" ? "badge-danger" :
                      squawk.severity === "major" ? "badge-warning" :
                      "badge-gray"
                    }`}>
                      {squawk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{squawk.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No open squawks 🎉</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {activity.recentTimesheets.slice(0, 6).map((ts) => (
              <div key={ts.id} className="flex items-start gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    <span className="font-medium">{ts.user.firstName}</span> logged {ts.hours}h
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {ts.workOrder ? `WO: ${ts.workOrder.woNumber}` : "Shop time"} — {ts.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(ts.workDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {activity.recentTimesheets.length === 0 && (
              <p className="text-gray-500 text-center py-6">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
