import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create demo shop
  const shop = await prisma.shop.upsert({
    where: { slug: "skyline-aviation" },
    update: {},
    create: {
      name: "Skyline Aviation Services",
      slug: "skyline-aviation",
      address: "123 Airport Rd, Hangar 5",
      phone: "(555) 123-4567",
      email: "info@skylineaviation.com",
      faaRepairStation: "XY2R345K",
      laborRate: 95.0,
      plan: "trial",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  })

  console.log(`✅ Shop created: ${shop.name}`)

  // Create demo user
  const passwordHash = await bcrypt.hash("demo123", 10)
  
  const owner = await prisma.user.upsert({
    where: { email: "demo@mxlogic.app" },
    update: {},
    create: {
      email: "demo@mxlogic.app",
      passwordHash,
      firstName: "Demo",
      lastName: "User",
      role: "owner",
      phone: "(555) 987-6543",
      faaCertNumber: "1234567",
      faaCertType: "IA",
      shopId: shop.id,
    },
  })

  console.log(`✅ User created: ${owner.email}`)

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: "demo-customer-1" },
      update: {},
      create: {
        id: "demo-customer-1",
        shopId: shop.id,
        name: "Flying Tigers LLC",
        contactName: "John Smith",
        email: "john@flyingtigers.com",
        phone: "(555) 111-2222",
        address: "456 Pilot Way",
        city: "Aviation City",
        state: "CA",
        zipCode: "90210",
      },
    }),
    prisma.customer.upsert({
      where: { id: "demo-customer-2" },
      update: {},
      create: {
        id: "demo-customer-2",
        shopId: shop.id,
        name: "Blue Skies Aviation",
        contactName: "Jane Doe",
        email: "jane@blueskies.aero",
        phone: "(555) 333-4444",
        address: "789 Runway Blvd",
        city: "Propville",
        state: "TX",
        zipCode: "75001",
      },
    }),
  ])

  console.log(`✅ Customers created: ${customers.length}`)

  // Create demo aircraft
  const aircraft = await Promise.all([
    prisma.aircraft.upsert({
      where: { nNumber: "N12345" },
      update: {},
      create: {
        shopId: shop.id,
        nNumber: "N12345",
        serialNumber: "28-7890123",
        manufacturer: "Cessna",
        model: "172S",
        year: 2015,
        typeCertificate: "3A12",
        voltage: "28v",
        baseAirport: "KORD",
        customerId: customers[0].id,
      },
    }),
    prisma.aircraft.upsert({
      where: { nNumber: "N67890" },
      update: {},
      create: {
        shopId: shop.id,
        nNumber: "N67890",
        serialNumber: "PA-28-8235001",
        manufacturer: "Piper",
        model: "PA-28-181",
        year: 2008,
        typeCertificate: "2A13",
        voltage: "14v",
        baseAirport: "KDAL",
        customerId: customers[1].id,
      },
    }),
    prisma.aircraft.upsert({
      where: { nNumber: "N24680" },
      update: {},
      create: {
        shopId: shop.id,
        nNumber: "N24680",
        serialNumber: "D-1234",
        manufacturer: "Diamond",
        model: "DA40",
        year: 2019,
        typeCertificate: "A53EU",
        voltage: "28v",
        baseAirport: "KORD",
        customerId: customers[0].id,
      },
    }),
  ])

  console.log(`✅ Aircraft created: ${aircraft.length}`)

  // Create timers for aircraft
  for (const ac of aircraft) {
    await prisma.timer.upsert({
      where: { id: `${ac.id}-hobbs` },
      update: {},
      create: {
        id: `${ac.id}-hobbs`,
        aircraftId: ac.id,
        timerType: "HOBBS",
        currentValue: Math.floor(Math.random() * 3000) + 500,
        sinceNew: Math.floor(Math.random() * 3000) + 500,
      },
    })
    await prisma.timer.upsert({
      where: { id: `${ac.id}-tach` },
      update: {},
      create: {
        id: `${ac.id}-tach`,
        aircraftId: ac.id,
        timerType: "TACH",
        currentValue: Math.floor(Math.random() * 2800) + 400,
        sinceNew: Math.floor(Math.random() * 2800) + 400,
      },
    })
  }

  console.log(`✅ Timers created`)

  // Create demo squawks
  await prisma.squawk.upsert({
    where: { id: "demo-squawk-1" },
    update: {},
    create: {
      id: "demo-squawk-1",
      aircraftId: aircraft[0].id,
      title: "Landing light inoperative",
      description: "Left landing light not working. Bulb may need replacement.",
      status: "open",
      severity: "minor",
      priority: 0,
      category: "Electrical",
      ataChapter: "33",
      reportedBy: "Pilot",
    },
  })

  await prisma.squawk.upsert({
    where: { id: "demo-squawk-2" },
    update: {},
    create: {
      id: "demo-squawk-2",
      aircraftId: aircraft[1].id,
      title: "Oil leak on engine cowling",
      description: "Small oil residue noticed on lower cowling after flight. Needs inspection.",
      status: "in_progress",
      severity: "major",
      priority: 1,
      category: "Engine",
      ataChapter: "71",
      reportedBy: "Mechanic",
    },
  })

  console.log(`✅ Squawks created`)

  // Create demo work order
  await prisma.workOrder.upsert({
    where: { woNumber: "WO-2024-001" },
    update: {},
    create: {
      woNumber: "WO-2024-001",
      title: "Annual Inspection",
      description: "Annual inspection per 14 CFR 43 Appendix D",
      status: "in_progress",
      workType: "annual",
      priority: 0,
      aircraftId: aircraft[0].id,
      customerId: customers[0].id,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      hobbsIn: 1523.4,
      tachIn: 1456.2,
      estimatedLabor: 1500,
      estimatedParts: 500,
      assignedMechanic: "Demo User",
    },
  })

  console.log(`✅ Work order created`)

  console.log("\n🎉 Database seeded successfully!")
  console.log("\n📝 Demo credentials:")
  console.log("   Email: demo@mxlogic.app")
  console.log("   Password: demo123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
