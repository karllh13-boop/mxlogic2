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

    const part = await prisma.part.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
      include: { inventoryItems: { where: { isActive: true } } },
    })

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error("GET /api/parts/[id] error:", error)
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

    const existing = await prisma.part.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    const data = await req.json()

    // Check uniqueness if part number changed
    if (data.partNumber && data.partNumber !== existing.partNumber) {
      const dup = await prisma.part.findUnique({
        where: { partNumber: data.partNumber },
      })
      if (dup) {
        return NextResponse.json({ error: "Part number already in use" }, { status: 400 })
      }
    }

    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        partNumber: data.partNumber ?? existing.partNumber,
        description: data.description,
        manufacturer: data.manufacturer,
        category: data.category,
        unitOfMeasure: data.unitOfMeasure ?? existing.unitOfMeasure,
        unitPrice: data.unitPrice ?? existing.unitPrice,
        minQuantity: data.minQuantity ?? existing.minQuantity,
        reorderQuantity: data.reorderQuantity,
        preferredVendor: data.preferredVendor,
        isSerialized: data.isSerialized ?? existing.isSerialized,
        isShelfLife: data.isShelfLife ?? existing.isShelfLife,
        notes: data.notes,
      },
    })

    return NextResponse.json(part)
  } catch (error) {
    console.error("PUT /api/parts/[id] error:", error)
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

    const existing = await prisma.part.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    await prisma.part.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/parts/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
