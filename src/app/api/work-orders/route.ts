import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Generate work order number
async function generateWoNumber(shopId: string): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2)
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0")
  
  // Get count of work orders this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const count = await prisma.workOrder.count({
    where: {
      aircraft: { shopId },
      createdAt: { gte: startOfMonth },
    },
  })

  const seq = (count + 1).toString().padStart(3, "0")
  return `WO${year}${month}-${seq}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workOrders = await prisma.workOrder.findMany({
      where: {
        aircraft: { shopId: session.user.shopId },
      },
      include: {
        aircraft: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(workOrders)
  } catch (error) {
    console.error("GET /api/work-orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.aircraftId) {
      return NextResponse.json({ error: "Aircraft is required" }, { status: 400 })
    }
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Verify aircraft belongs to shop
    const aircraft = await prisma.aircraft.findFirst({
      where: {
        id: data.aircraftId,
        shopId: session.user.shopId,
      },
    })

    if (!aircraft) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    // Generate work order number
    const woNumber = await generateWoNumber(session.user.shopId)

    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        aircraftId: data.aircraftId,
        customerId: data.customerId,
        title: data.title,
        description: data.description,
        status: "draft",
        workType: data.workType,
        priority: data.priority || 0,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
        hobbsIn: data.hobbsIn,
        tachIn: data.tachIn,
        estimatedLabor: data.estimatedLabor,
        estimatedParts: data.estimatedParts,
        notes: data.notes,
      },
    })

    return NextResponse.json(workOrder, { status: 201 })
  } catch (error) {
    console.error("POST /api/work-orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
