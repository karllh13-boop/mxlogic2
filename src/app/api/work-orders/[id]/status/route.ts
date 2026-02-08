import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  draft: ["open"],
  open: ["in_progress", "cancelled"],
  in_progress: ["pending_parts", "completed", "cancelled"],
  pending_parts: ["in_progress", "cancelled"],
  completed: ["invoiced", "in_progress"],
  invoiced: [],
  cancelled: ["open"],
}

export async function PATCH(
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

    const { status } = await req.json()
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Validate transition
    const allowed = validTransitions[existing.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from '${existing.status}' to '${status}'` },
        { status: 400 }
      )
    }

    // Set timestamps based on status
    const updates: any = { status }
    if (status === "in_progress" && !existing.actualStart) {
      updates.actualStart = new Date()
    }
    if (status === "completed") {
      updates.actualEnd = new Date()
    }

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error("PATCH /api/work-orders/[id]/status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
