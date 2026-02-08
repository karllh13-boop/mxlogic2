import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await prisma.timesheetEntry.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Timesheet entry not found" }, { status: 404 })
    }

    const data = await req.json()

    const timesheet = await prisma.timesheetEntry.update({
      where: { id: params.id },
      data: {
        workOrderId: data.workOrderId ?? existing.workOrderId,
        description: data.description ?? existing.description,
        taskType: data.taskType,
        workDate: data.workDate ? new Date(data.workDate) : existing.workDate,
        startTime: data.startTime ?? existing.startTime,
        endTime: data.endTime ?? existing.endTime,
        hours: data.hours ? parseFloat(data.hours) : existing.hours,
        isBillable: data.isBillable ?? existing.isBillable,
        rate: data.rate ?? existing.rate,
        notes: data.notes,
        status: data.status ?? existing.status,
        approvedById: data.status === "approved" ? session.user.id : existing.approvedById,
        approvedAt: data.status === "approved" ? new Date() : existing.approvedAt,
      },
    })

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("PUT /api/timesheets/[id] error:", error)
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

    const existing = await prisma.timesheetEntry.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Timesheet entry not found" }, { status: 404 })
    }

    await prisma.timesheetEntry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/timesheets/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
