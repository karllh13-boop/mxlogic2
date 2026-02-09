import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { CommandPalette } from "@/components/ui/CommandPalette"

async function getNavBadges(shopId: string) {
  const [openSquawks, activeWOs, pendingTimesheets, openADs] = await Promise.all([
    prisma.squawk.count({
      where: { aircraft: { shopId }, status: { in: ["open", "in_progress"] } },
    }),
    prisma.workOrder.count({
      where: { aircraft: { shopId }, status: { in: ["open", "in_progress", "pending_parts"] } },
    }),
    prisma.timesheetEntry.count({
      where: { shopId, status: "pending" },
    }),
    prisma.aDCompliance.count({
      where: { aircraft: { shopId }, status: "open" },
    }),
  ])
  return { openSquawks, activeWOs, pendingTimesheets, openADs }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const badges = session.user.shopId
    ? await getNavBadges(session.user.shopId)
    : { openSquawks: 0, activeWOs: 0, pendingTimesheets: 0, openADs: 0 }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={session.user} badges={badges} />
      <div className="lg:pl-64">
        <Header user={session.user} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
