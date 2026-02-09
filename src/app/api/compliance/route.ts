import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adRecords = await prisma.aDCompliance.findMany({
      where: {
        aircraft: { shopId: session.user.shopId },
      },
      include: {
        aircraft: true,
        workOrder: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(adRecords)
  } catch (error) {
    console.error("GET /api/compliance error:", error)
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

    if (!data.aircraftId || !data.adNumber) {
      return NextResponse.json(
        { error: "Aircraft and AD Number are required" },
        { status: 400 }
      )
    }

    // Verify aircraft belongs to shop
    const aircraft = await prisma.aircraft.findFirst({
      where: {
        id: data.aircraftId,
        shopId: session.user.shopId,
      },
    })

    if (!aircraft) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    // Check for duplicate AD on same aircraft
    const existing = await prisma.aDCompliance.findUnique({
      where: {
        aircraftId_adNumber: {
          aircraftId: data.aircraftId,
          adNumber: data.adNumber,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "This AD is already tracked for this aircraft" },
        { status: 400 }
      )
    }

    const adRecord = await prisma.aDCompliance.create({
      data: {
        aircraftId: data.aircraftId,
        adNumber: data.adNumber,
        adTitle: data.adTitle,
        status: data.status || "open",
        complianceDate: data.complianceDate
          ? new Date(data.complianceDate)
          : null,
        complianceHours: data.complianceHours,
        methodOfCompliance: data.methodOfCompliance,
        compliedBy: data.compliedBy,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        nextDueHours: data.nextDueHours,
        intervalHours: data.intervalHours,
        intervalMonths: data.intervalMonths,
        notes: data.notes,
      },
    })

    return NextResponse.json(adRecord, { status: 201 })
  } catch (error) {
    console.error("POST /api/compliance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
