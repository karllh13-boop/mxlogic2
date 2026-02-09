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

    const wo = await prisma.workOrder.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!wo) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    const items = await prisma.workOrderItem.findMany({
      where: { workOrderId: params.id },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("GET /api/work-orders/[id]/items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wo = await prisma.workOrder.findFirst({
      where: { id: params.id, aircraft: { shopId: session.user.shopId } },
    })
    if (!wo) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 })
    }

    const data = await req.json()

    if (!data.itemType || !data.description) {
      return NextResponse.json(
        { error: "Item type and description are required" },
        { status: 400 }
      )
    }

    const item = await prisma.workOrderItem.create({
      data: {
        workOrderId: params.id,
        itemType: data.itemType, // labor, parts, subcontract
        description: data.description,
        partNumber: data.partNumber || null,
        quantity: data.quantity || 1,
        unitPrice: data.unitPrice || null,
        hours: data.hours || null,
        rate: data.rate || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("POST /api/work-orders/[id]/items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
