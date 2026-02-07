import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Plane, Users, AlertTriangle, ClipboardList, Package, Clock } from "lucide-react"
import Link from "next/link"

async function getStats(shopId: string) {
  const [
    aircraftCount,
    customerCount,
    openSquawks,
    activeWorkOrders,
    lowStockParts,
  ] = await Promise.all([
    prisma.aircraft.count({ where: { shopId, isActive: true } }),
    prisma.customer.count({ where: { shopId } }),
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
    0, // TODO: implement low stock query
  ])

  return {
    aircraftCount,
    customerCount,
    openSquawks,
    activeWorkOrders,
    lowStockParts,
  }
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

  const [stats, recentWorkOrders, openSquawks] = await Promise.all([
    getStats(shopId),
    getRecentWorkOrders(shopId),
    getOpenSquawks(shopId),
  ])

  const statCards = [
    { name: "Aircraft", value: stats.aircraftCount, icon: Plane, href: "/aircraft", color: "bg-blue-500" },
    { name: "Customers", value: stats.customerCount, icon: Users, href: "/customers", color: "bg-green-500" },
    { name: "Open Squawks", value: stats.openSquawks, icon: AlertTriangle, href: "/squawks", color: "bg-yellow-500" },
    { name: "Active Work Orders", value: stats.activeWorkOrders, icon: ClipboardList, href: "/work-orders", color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Recent Work Orders</h2>
            <Link href="/work-orders" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {recentWorkOrders.length > 0 ? (
            <div className="space-y-4">
              {recentWorkOrders.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="block p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{wo.woNumber}</p>
                      <p className="text-sm text-gray-500">{wo.aircraft.nNumber} - {wo.title}</p>
                    </div>
                    <span className={`badge ${
                      wo.status === "completed" ? "badge-success" :
                      wo.status === "in_progress" ? "badge-info" :
                      wo.status === "pending_parts" ? "badge-warning" :
                      "badge-gray"
                    }`}>
                      {wo.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No work orders yet</p>
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
            <div className="space-y-4">
              {openSquawks.map((squawk) => (
                <Link
                  key={squawk.id}
                  href={`/squawks/${squawk.id}`}
                  className="block p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{squawk.title}</p>
                      <p className="text-sm text-gray-500">{squawk.aircraft.nNumber}</p>
                    </div>
                    <span className={`badge ${
                      squawk.severity === "critical" ? "badge-danger" :
                      squawk.severity === "major" ? "badge-warning" :
                      "badge-gray"
                    }`}>
                      {squawk.severity}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No open squawks 🎉</p>
          )}
        </div>
      </div>
    </div>
  )
}
