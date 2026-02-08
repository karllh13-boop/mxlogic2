"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Plane, Home, Users, AlertTriangle, ClipboardList, Package, Shield, Clock, FileText, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Aircraft", href: "/aircraft", icon: Plane },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Squawks", href: "/squawks", icon: AlertTriangle },
  { name: "Work Orders", href: "/work-orders", icon: ClipboardList },
  { name: "Parts", href: "/parts", icon: Package },
  { name: "AD Compliance", href: "/compliance", icon: Shield },
  { name: "Timesheets", href: "/timesheets", icon: Clock },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
  shopName?: string
}

export function MobileNav({ open, onClose, shopName }: MobileNavProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Close on navigation
  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">MxLogic</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {shopName && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Shop</p>
            <p className="text-sm font-medium text-gray-900">{shopName}</p>
          </div>
        )}

        <nav className="px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
