"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Plane,
  Users,
  AlertTriangle,
  ClipboardList,
  Package,
  FileText,
  Settings,
  Shield,
  Clock,
  Boxes,
} from "lucide-react"

interface NavBadges {
  openSquawks: number
  activeWOs: number
  pendingTimesheets: number
  openADs: number
}

interface SidebarProps {
  user: {
    name?: string | null
    shopName?: string
    role?: string
  }
  badges?: NavBadges
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, badgeKey: null },
  { name: "Aircraft", href: "/aircraft", icon: Plane, badgeKey: null },
  { name: "Customers", href: "/customers", icon: Users, badgeKey: null },
  { name: "Squawks", href: "/squawks", icon: AlertTriangle, badgeKey: "openSquawks" as const },
  { name: "Work Orders", href: "/work-orders", icon: ClipboardList, badgeKey: "activeWOs" as const },
  { name: "Parts", href: "/parts", icon: Package, badgeKey: null },
  { name: "Inventory", href: "/inventory", icon: Boxes, badgeKey: null },
  { name: "AD Compliance", href: "/compliance", icon: Shield, badgeKey: "openADs" as const },
  { name: "Timesheets", href: "/timesheets", icon: Clock, badgeKey: "pendingTimesheets" as const },
  { name: "Reports", href: "/reports", icon: FileText, badgeKey: null },
  { name: "Settings", href: "/settings", icon: Settings, badgeKey: null },
]

export function Sidebar({ user, badges }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">MxLogic</span>
        </div>

        {/* Shop name */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Shop</p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.shopName || "My Shop"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500"}
                  `}
                />
                <span className="flex-1">{item.name}</span>
                {badgeCount > 0 && (
                  <span className={`
                    ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
                    ${item.badgeKey === "openADs" 
                      ? "bg-red-100 text-red-700"
                      : item.badgeKey === "openSquawks"
                      ? "bg-yellow-100 text-yellow-700"  
                      : "bg-primary-100 text-primary-700"
                    }
                  `}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
