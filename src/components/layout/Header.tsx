"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Bell, Search, LogOut, Menu } from "lucide-react"
import { MobileNav } from "./MobileNav"

interface HeaderProps {
  user: {
    name?: string | null
    role?: string
    shopName?: string
  }
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function openCommandPalette() {
    // Trigger Cmd+K programmatically
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search - clickable to open command palette */}
          <div className="flex-1 max-w-lg mx-4">
            <button
              onClick={openCommandPalette}
              className="w-full flex items-center pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-colors relative"
            >
              <Search className="absolute left-3 w-4 h-4" />
              <span className="flex-1 text-left">Search aircraft, customers, work orders...</span>
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded border border-gray-200 ml-2">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        shopName={user.shopName}
      />
    </>
  )
}
