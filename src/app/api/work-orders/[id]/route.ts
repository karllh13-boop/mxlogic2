import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
      include: {
        aircraft: true,
        customer: true,
        squawks: true,
        discrepancies: { include: { mechanic: true, workEntries: true } },
        timesheetEntries: { include: { user: true } },
      },
    })

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error("GET /api/work-orders/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.workOrder.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    const data = await req.json()

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        title: data.title ?? existing.title,
        description: data.description,
        status: data.status ?? existing.status,
        workType: data.workType,
        priority: data.priority ?? existing.priority,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : existing.scheduledStart,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : existing.scheduledEnd,
        actualStart: data.actualStart ? new Date(data.actualStart) : existing.actualStart,
        actualEnd: data.actualEnd ? new Date(data.actualEnd) : existing.actualEnd,
        hobbsIn: data.hobbsIn ?? existing.hobbsIn,
        tachIn: data.tachIn ?? existing.tachIn,
        hobbsOut: data.hobbsOut ?? existing.hobbsOut,
        tachOut: data.tachOut ?? existing.tachOut,
        estimatedLabor: data.estimatedLabor ?? existing.estimatedLabor,
        estimatedParts: data.estimatedParts ?? existing.estimatedParts,
        assignedMechanic: data.assignedMechanic,
        inspector: data.inspector,
        customerId: data.customerId || existing.customerId,
        notes: data.notes,
      },
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error("PUT /api/work-orders/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.workOrder.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    // Set status to cancelled rather than hard delete
    await prisma.workOrder.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/work-orders/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
