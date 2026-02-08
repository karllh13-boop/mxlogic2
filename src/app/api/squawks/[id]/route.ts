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

    const squawk = await prisma.squawk.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
      include: { aircraft: true, workOrder: true },
    })

    if (!squawk) {
      return NextResponse.json({ error: "Squawk not found" }, { status: 404 })
    }

    return NextResponse.json(squawk)
  } catch (error) {
    console.error("GET /api/squawks/[id] error:", error)
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

    const existing = await prisma.squawk.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Squawk not found" }, { status: 404 })
    }

    const data = await req.json()

    const squawk = await prisma.squawk.update({
      where: { id: params.id },
      data: {
        title: data.title ?? existing.title,
        description: data.description,
        status: data.status ?? existing.status,
        severity: data.severity ?? existing.severity,
        priority: data.priority ?? existing.priority,
        category: data.category,
        ataChapter: data.ataChapter,
        reportedBy: data.reportedBy,
        assignedTo: data.assignedTo,
        estimatedHours: data.estimatedHours,
        estimatedCost: data.estimatedCost,
        partsNeeded: data.partsNeeded,
        resolvedDate: data.status === "resolved" ? new Date() : existing.resolvedDate,
        resolutionNotes: data.resolutionNotes,
        workOrderId: data.workOrderId ?? existing.workOrderId,
      },
    })

    return NextResponse.json(squawk)
  } catch (error) {
    console.error("PUT /api/squawks/[id] error:", error)
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

    const existing = await prisma.squawk.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Squawk not found" }, { status: 404 })
    }

    await prisma.squawk.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/squawks/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
