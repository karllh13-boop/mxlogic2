import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const q = req.nextUrl.searchParams.get("q")
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const shopId = session.user.shopId

    const [aircraft, customers, workOrders, squawks] = await Promise.all([
      prisma.aircraft.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [
            { nNumber: { contains: q } },
            { manufacturer: { contains: q } },
            { model: { contains: q } },
            { registeredOwner: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.customer.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [
            { name: { contains: q } },
            { contactName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.workOrder.findMany({
        where: {
          aircraft: { shopId },
          OR: [
            { woNumber: { contains: q } },
            { title: { contains: q } },
          ],
        },
        include: { aircraft: true },
        take: 5,
      }),
      prisma.squawk.findMany({
        where: {
          aircraft: { shopId },
          OR: [
            { title: { contains: q } },
          ],
        },
        include: { aircraft: true },
        take: 5,
      }),
    ])

    const results = [
      ...aircraft.map(a => ({
        type: "aircraft" as const,
        id: a.id,
        title: a.nNumber,
        subtitle: `${a.year || ""} ${a.manufacturer || ""} ${a.model || ""}`.trim(),
        href: `/aircraft/${a.id}`,
      })),
      ...customers.map(c => ({
        type: "customer" as const,
        id: c.id,
        title: c.name,
        subtitle: c.contactName || c.email || "",
        href: `/customers/${c.id}`,
      })),
      ...workOrders.map(w => ({
        type: "work-order" as const,
        id: w.id,
        title: w.woNumber,
        subtitle: `${w.aircraft.nNumber} — ${w.title}`,
        href: `/work-orders/${w.id}`,
      })),
      ...squawks.map(s => ({
        type: "squawk" as const,
        id: s.id,
        title: s.title,
        subtitle: `${s.aircraft.nNumber} • ${s.severity}`,
        href: `/squawks/${s.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("GET /api/search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
