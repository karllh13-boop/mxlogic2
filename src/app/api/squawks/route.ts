import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const squawks = await prisma.squawk.findMany({
      where: {
        aircraft: { shopId: session.user.shopId },
      },
      include: {
        aircraft: true,
        workOrder: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(squawks)
  } catch (error) {
    console.error("GET /api/squawks error:", error)
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
    if (!data.aircraftId) {
      return NextResponse.json({ error: "Aircraft is required" }, { status: 400 })
    }
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
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

    const squawk = await prisma.squawk.create({
      data: {
        aircraftId: data.aircraftId,
        title: data.title,
        description: data.description,
        status: "open",
        severity: data.severity || "minor",
        priority: data.priority || 0,
        category: data.category,
        ataChapter: data.ataChapter,
        reportedBy: data.reportedBy,
        estimatedHours: data.estimatedHours,
        estimatedCost: data.estimatedCost,
        partsNeeded: data.partsNeeded,
      },
    })

    return NextResponse.json(squawk, { status: 201 })
  } catch (error) {
    console.error("POST /api/squawks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
