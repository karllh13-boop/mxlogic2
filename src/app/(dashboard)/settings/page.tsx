import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Settings, Building2, CreditCard, Users, Bell, Shield } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()
  const shopId = session?.user?.shopId
  const userRole = session?.user?.role

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  // Only owners and admins can access settings
  if (!["owner", "admin"].includes(userRole || "")) {
    redirect("/dashboard")
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  if (!shop) {
    return <div>Error: Shop not found</div>
  }

  const settingsSections = [
    {
      title: "Shop Profile",
      description: "Update your shop name, address, contact information, and FAA repair station details.",
      icon: Building2,
      href: "/settings/shop",
      color: "bg-blue-500",
    },
    {
      title: "User Management",
      description: `Manage ${shop._count.users} team members, roles, and permissions.`,
      icon: Users,
      href: "/settings/users",
      color: "bg-green-500",
    },
    {
      title: "Billing & Subscription",
      description: `Current plan: ${shop.plan.toUpperCase()}. Manage your subscription and payment methods.`,
      icon: CreditCard,
      href: "/settings/billing",
      color: "bg-purple-500",
    },
    {
      title: "Notifications",
      description: "Configure email notifications, alerts, and reminders for your team.",
      icon: Bell,
      href: "/settings/notifications",
      color: "bg-yellow-500",
    },
    {
      title: "Security",
      description: "Manage passwords, two-factor authentication, and audit logs.",
      icon: Shield,
      href: "/settings/security",
      color: "bg-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your shop configuration</p>
      </div>

      {/* Shop Overview Card */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{shop.name}</h2>
            <p className="text-primary-100 mt-1">
              {shop.faaRepairStation && `FAA ${shop.faaRepairStation} • `}
              {shop.address || "No address set"}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {shop.plan.toUpperCase()} Plan
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                ${shop.laborRate}/hr labor rate
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {shop._count.users} users
              </span>
            </div>
          </div>
          <Settings className="w-16 h-16 text-primary-200" />
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start">
              <div className={`${section.color} p-3 rounded-lg mr-4`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <p className="text-gray-500 mt-1">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn btn-secondary w-full">
            Export Data
          </button>
          <button className="btn btn-secondary w-full">
            Import Aircraft
          </button>
          <button className="btn btn-secondary w-full">
            Download Reports
          </button>
          <Link href="/settings/integrations" className="btn btn-secondary w-full text-center">
            Integrations
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-gray-500 mb-4">
          Irreversible actions. Please be careful.
        </p>
        <div className="flex gap-4">
          <button className="btn btn-outline border-red-300 text-red-600 hover:bg-red-50">
            Delete All Data
          </button>
          <button className="btn btn-outline border-red-300 text-red-600 hover:bg-red-50">
            Close Account
          </button>
        </div>
      </div>
    </div>
  )
}
