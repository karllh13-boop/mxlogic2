import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timesheets = await prisma.timesheetEntry.findMany({
      where: { shopId: session.user.shopId },
      include: {
        user: true,
        workOrder: { include: { aircraft: true } },
      },
      orderBy: { workDate: "desc" },
    })

    return NextResponse.json(timesheets)
  } catch (error) {
    console.error("GET /api/timesheets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    if (!data.workDate) {
      return NextResponse.json({ error: "Work date is required" }, { status: 400 })
    }
    if (!data.hours || data.hours <= 0) {
      return NextResponse.json({ error: "Hours must be greater than 0" }, { status: 400 })
    }

    // If work order specified, verify it belongs to shop
    if (data.workOrderId) {
      const wo = await prisma.workOrder.findFirst({
        where: { id: data.workOrderId, aircraft: { shopId: session.user.shopId } },
      })
      if (!wo) {
        return NextResponse.json({ error: "Work order not found" }, { status: 404 })
      }
    }

    // Get shop's labor rate
    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
    })

    const timesheet = await prisma.timesheetEntry.create({
      data: {
        userId: session.user.id,
        shopId: session.user.shopId,
        workOrderId: data.workOrderId || null,
        description: data.description,
        taskType: data.taskType,
        workDate: new Date(data.workDate),
        startTime: data.startTime,
        endTime: data.endTime,
        hours: parseFloat(data.hours),
        isBillable: data.isBillable ?? true,
        rate: data.rate || shop?.laborRate || 85,
        notes: data.notes,
        status: "pending",
      },
    })

    return NextResponse.json(timesheet, { status: 201 })
  } catch (error) {
    console.error("POST /api/timesheets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
