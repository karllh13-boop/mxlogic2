import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parts = await prisma.part.findMany({
      where: {
        shopId: session.user.shopId,
        isActive: true,
      },
      orderBy: { partNumber: "asc" },
    })

    return NextResponse.json(parts)
  } catch (error) {
    console.error("GET /api/parts error:", error)
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

    if (!data.partNumber) {
      return NextResponse.json({ error: "Part number is required" }, { status: 400 })
    }

    // Check for duplicate
    const existing = await prisma.part.findUnique({
      where: { partNumber: data.partNumber },
    })
    if (existing) {
      return NextResponse.json({ error: "Part number already exists" }, { status: 400 })
    }

    const part = await prisma.part.create({
      data: {
        shopId: session.user.shopId,
        partNumber: data.partNumber,
        description: data.description,
        manufacturer: data.manufacturer,
        category: data.category,
        unitOfMeasure: data.unitOfMeasure || "ea",
        unitPrice: data.unitPrice || 0,
        minQuantity: data.minQuantity || 0,
        reorderQuantity: data.reorderQuantity,
        preferredVendor: data.preferredVendor,
        isSerialized: data.isSerialized || false,
        isShelfLife: data.isShelfLife || false,
        notes: data.notes,
      },
    })

    // Create initial inventory item if quantity provided
    if (data.initialQuantity && data.initialQuantity > 0) {
      await prisma.inventoryItem.create({
        data: {
          partId: part.id,
          quantity: data.initialQuantity,
          unitPrice: data.unitPrice,
          condition: "NEW",
          location: data.location,
          receivedDate: new Date(),
        },
      })
    }

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    console.error("POST /api/parts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
