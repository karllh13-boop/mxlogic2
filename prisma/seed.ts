import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create shop
  const shop = await prisma.shop.upsert({
    where: { slug: "demo-shop" },
    update: {},
    create: {
      name: "Demo Aviation Shop",
      slug: "demo-shop",
      address: "123 Hangar Way",
      phone: "(555) 123-4567",
      email: "demo@mxlogic.com",
      faaRepairStation: "DEMO123",
      laborRate: 95.0,
      plan: "shop",
    },
  })

  console.log(`✓ Created shop: ${shop.name}`)

  // Create admin user
  const passwordHash = await bcrypt.hash("demo1234", 12)
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "owner",
      shopId: shop.id,
    },
  })

  console.log(`✓ Created user: ${admin.email}`)

  // Create a sample customer
  const customer = await prisma.customer.upsert({
    where: { id: "demo-customer" },
    update: {},
    create: {
      id: "demo-customer",
      shopId: shop.id,
      name: "Acme Flying Club",
      contactName: "John Smith",
      email: "john@acmeflying.com",
      phone: "(555) 987-6543",
      city: "Hartford",
      state: "CT",
    },
  })

  console.log(`✓ Created customer: ${customer.name}`)

  // Create sample aircraft
  const aircraft = await prisma.aircraft.upsert({
    where: { nNumber: "N12345" },
    update: {},
    create: {
      shopId: shop.id,
      nNumber: "N12345",
      serialNumber: "172-12345",
      manufacturer: "Cessna",
      model: "172S",
      year: 2018,
      voltage: "28v",
      baseAirport: "KHFD",
      customerId: customer.id,
      registeredOwner: "Acme Flying Club",
    },
  })

  console.log(`✓ Created aircraft: ${aircraft.nNumber}`)

  // Create timers for aircraft
  await prisma.timer.createMany({
    data: [
      { aircraftId: aircraft.id, timerType: "HOBBS", currentValue: 1250.5 },
      { aircraftId: aircraft.id, timerType: "TACH", currentValue: 1180.2 },
    ],
    skipDuplicates: true,
  })

  console.log(`✓ Created timers`)

  // Create sample squawk
  const squawk = await prisma.squawk.create({
    data: {
      aircraftId: aircraft.id,
      title: "Avionics fan noisy on startup",
      description: "Pilot reported grinding noise from avionics cooling fan during first 5 minutes of operation. Noise goes away after warmup.",
      severity: "minor",
      category: "Avionics",
      reportedBy: "Pilot - J. Smith",
    },
  })

  console.log(`✓ Created squawk: ${squawk.title}`)

  console.log("\n✅ Seed complete!")
  console.log("\n📧 Login credentials:")
  console.log("   Email: admin@demo.com")
  console.log("   Password: demo1234")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
