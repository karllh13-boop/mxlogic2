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

    const aircraft = await prisma.aircraft.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
      include: { customer: true, timers: true },
    })

    if (!aircraft) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("GET /api/aircraft/[id] error:", error)
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

    const existing = await prisma.aircraft.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    const data = await req.json()

    // Check N-number uniqueness if changed
    if (data.nNumber && data.nNumber.toUpperCase() !== existing.nNumber) {
      const duplicate = await prisma.aircraft.findUnique({
        where: { nNumber: data.nNumber.toUpperCase() },
      })
      if (duplicate) {
        return NextResponse.json({ error: "N-Number already in use" }, { status: 400 })
      }
    }

    const aircraft = await prisma.aircraft.update({
      where: { id: params.id },
      data: {
        nNumber: data.nNumber?.toUpperCase() ?? existing.nNumber,
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        year: data.year,
        typeCertificate: data.typeCertificate,
        voltage: data.voltage,
        registeredOwner: data.registeredOwner,
        registeredAddress: data.registeredAddress,
        baseAirport: data.baseAirport?.toUpperCase(),
        customerId: data.customerId || null,
        notes: data.notes,
        isActive: data.isActive ?? existing.isActive,
      },
    })

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("PUT /api/aircraft/[id] error:", error)
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

    const existing = await prisma.aircraft.findFirst({
      where: { id: params.id, shopId: session.user.shopId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    // Soft delete - set inactive
    await prisma.aircraft.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/aircraft/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
