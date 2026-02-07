import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
      where: {
        shopId: session.user.shopId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("GET /api/customers error:", error)
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
    if (!data.name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        shopId: session.user.shopId,
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || "USA",
        notes: data.notes,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
