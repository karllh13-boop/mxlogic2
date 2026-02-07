import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const aircraft = await prisma.aircraft.findMany({
      where: {
        shopId: session.user.shopId,
        isActive: true,
      },
      orderBy: { nNumber: "asc" },
    })

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("GET /api/aircraft error:", error)
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
    if (!data.nNumber) {
      return NextResponse.json({ error: "N-Number is required" }, { status: 400 })
    }

    // Check for duplicate N-number
    const existing = await prisma.aircraft.findUnique({
      where: { nNumber: data.nNumber.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json({ error: "Aircraft with this N-Number already exists" }, { status: 400 })
    }

    const aircraft = await prisma.aircraft.create({
      data: {
        shopId: session.user.shopId,
        nNumber: data.nNumber.toUpperCase(),
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        year: data.year,
        typeCertificate: data.typeCertificate,
        voltage: data.voltage,
        registeredOwner: data.registeredOwner,
        registeredAddress: data.registeredAddress,
        baseAirport: data.baseAirport?.toUpperCase(),
        customerId: data.customerId,
        notes: data.notes,
      },
    })

    // Create default timers
    await prisma.timer.createMany({
      data: [
        { aircraftId: aircraft.id, timerType: "HOBBS" },
        { aircraftId: aircraft.id, timerType: "TACH" },
      ],
    })

    return NextResponse.json(aircraft, { status: 201 })
  } catch (error) {
    console.error("POST /api/aircraft error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
