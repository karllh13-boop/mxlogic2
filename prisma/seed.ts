import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Check if already seeded
  const existingShop = await prisma.shop.findUnique({ where: { slug: "demo-shop" } })
  const existingAircraft = await prisma.aircraft.count()
  if (existingShop && existingAircraft > 2) {
    console.log("✅ Database already seeded, skipping.")
    return
  }
  
  console.log("🌱 Seeding database...")

  // ─── Shop ───────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { slug: "demo-shop" },
    update: {},
    create: {
      name: "Darcy Aviation Services",
      slug: "demo-shop",
      address: "456 Airport Rd, Hangar 12",
      phone: "(860) 555-0199",
      email: "service@darcyaviation.com",
      faaRepairStation: "D4RS789",
      laborRate: 95.0,
      plan: "shop",
      timezone: "US/Eastern",
    },
  })
  console.log(`✓ Shop: ${shop.name}`)

  // ─── Users ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("demo1234", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      passwordHash,
      firstName: "Ludwig",
      lastName: "Hellstrom",
      role: "owner",
      faaCertNumber: "123456789",
      faaCertType: "AP",
      shopId: shop.id,
    },
  })

  const mechanic1 = await prisma.user.upsert({
    where: { email: "mike@demo.com" },
    update: {},
    create: {
      email: "mike@demo.com",
      passwordHash,
      firstName: "Mike",
      lastName: "Day",
      role: "mechanic",
      faaCertNumber: "987654321",
      faaCertType: "AP",
      shopId: shop.id,
    },
  })

  const mechanic2 = await prisma.user.upsert({
    where: { email: "sarah@demo.com" },
    update: {},
    create: {
      email: "sarah@demo.com",
      passwordHash,
      firstName: "Sarah",
      lastName: "Chen",
      role: "mechanic",
      faaCertNumber: "456789123",
      faaCertType: "IA",
      shopId: shop.id,
    },
  })

  console.log(`✓ Users: ${admin.email}, ${mechanic1.email}, ${mechanic2.email}`)

  // ─── Customers ──────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: "cust-acme" },
      update: {},
      create: {
        id: "cust-acme",
        shopId: shop.id,
        name: "Acme Flying Club",
        contactName: "John Smith",
        email: "john@acmeflying.com",
        phone: "(860) 555-1234",
        address: "100 Airport Rd",
        city: "Hartford",
        state: "CT",
        zipCode: "06103",
      },
    }),
    prisma.customer.upsert({
      where: { id: "cust-skyview" },
      update: {},
      create: {
        id: "cust-skyview",
        shopId: shop.id,
        name: "SkyView Aviation LLC",
        contactName: "Tom Bradley",
        email: "tom@skyviewav.com",
        phone: "(203) 555-5678",
        address: "200 Pilot Lane",
        city: "Danbury",
        state: "CT",
        zipCode: "06810",
      },
    }),
    prisma.customer.upsert({
      where: { id: "cust-johnson" },
      update: {},
      create: {
        id: "cust-johnson",
        shopId: shop.id,
        name: "Robert Johnson",
        contactName: "Robert Johnson",
        email: "rjohnson@gmail.com",
        phone: "(203) 555-9012",
        city: "Brookfield",
        state: "CT",
        zipCode: "06804",
        notes: "Private owner, single aircraft. Prefers text communication.",
      },
    }),
    prisma.customer.upsert({
      where: { id: "cust-newengland" },
      update: {},
      create: {
        id: "cust-newengland",
        shopId: shop.id,
        name: "New England Flight Training",
        contactName: "Lisa Chen",
        email: "lisa@neft.com",
        phone: "(860) 555-3456",
        address: "300 Runway Blvd",
        city: "New Haven",
        state: "CT",
        zipCode: "06501",
        notes: "Flight school, 4 aircraft. Monthly billing agreement.",
      },
    }),
  ])
  console.log(`✓ Customers: ${customers.length}`)

  // ─── Aircraft ───────────────────────────────────────
  const aircraftData = [
    {
      nNumber: "N12345",
      serialNumber: "172S-12345",
      manufacturer: "Cessna",
      model: "172S Skyhawk SP",
      year: 2018,
      voltage: "28v",
      baseAirport: "KDXR",
      customerId: "cust-acme",
      registeredOwner: "Acme Flying Club",
      hobbs: 1250.5,
      tach: 1180.2,
    },
    {
      nNumber: "N67890",
      serialNumber: "28-7990255",
      manufacturer: "Piper",
      model: "PA-28-181 Archer III",
      year: 2005,
      voltage: "14v",
      baseAirport: "KDXR",
      customerId: "cust-acme",
      registeredOwner: "Acme Flying Club",
      hobbs: 3450.2,
      tach: 3280.1,
    },
    {
      nNumber: "N54321",
      serialNumber: "182T-08432",
      manufacturer: "Cessna",
      model: "182T Skylane",
      year: 2015,
      voltage: "28v",
      baseAirport: "KDXR",
      customerId: "cust-skyview",
      registeredOwner: "SkyView Aviation LLC",
      hobbs: 2100.8,
      tach: 1985.3,
    },
    {
      nNumber: "N98765",
      serialNumber: "A2-0149",
      manufacturer: "Cirrus",
      model: "SR22 G6",
      year: 2020,
      voltage: "28v",
      baseAirport: "KHVN",
      customerId: "cust-johnson",
      registeredOwner: "Robert Johnson",
      hobbs: 450.3,
      tach: 425.1,
    },
    {
      nNumber: "N11111",
      serialNumber: "172R-1204",
      manufacturer: "Cessna",
      model: "172R Skyhawk",
      year: 2000,
      voltage: "28v",
      baseAirport: "KHVN",
      customerId: "cust-newengland",
      registeredOwner: "New England Flight Training",
      hobbs: 8900.4,
      tach: 8500.2,
    },
    {
      nNumber: "N22222",
      serialNumber: "172S-10888",
      manufacturer: "Cessna",
      model: "172S Skyhawk SP",
      year: 2012,
      voltage: "28v",
      baseAirport: "KHVN",
      customerId: "cust-newengland",
      registeredOwner: "New England Flight Training",
      hobbs: 6200.1,
      tach: 5900.8,
    },
    {
      nNumber: "N33333",
      serialNumber: "DA40-180-0456",
      manufacturer: "Diamond",
      model: "DA40 Star",
      year: 2008,
      voltage: "14v",
      baseAirport: "KDXR",
      customerId: "cust-newengland",
      registeredOwner: "New England Flight Training",
      hobbs: 5100.5,
      tach: 4800.3,
    },
  ]

  const createdAircraft: Record<string, string> = {}

  for (const ac of aircraftData) {
    const aircraft = await prisma.aircraft.upsert({
      where: { nNumber: ac.nNumber },
      update: {},
      create: {
        shopId: shop.id,
        nNumber: ac.nNumber,
        serialNumber: ac.serialNumber,
        manufacturer: ac.manufacturer,
        model: ac.model,
        year: ac.year,
        voltage: ac.voltage,
        baseAirport: ac.baseAirport,
        customerId: ac.customerId,
        registeredOwner: ac.registeredOwner,
      },
    })
    createdAircraft[ac.nNumber] = aircraft.id

    // Create timers
    await prisma.timer.deleteMany({ where: { aircraftId: aircraft.id } })
    await prisma.timer.createMany({
      data: [
        { aircraftId: aircraft.id, timerType: "HOBBS", currentValue: ac.hobbs, sinceNew: ac.hobbs },
        { aircraftId: aircraft.id, timerType: "TACH", currentValue: ac.tach, sinceNew: ac.tach },
      ],
    })
  }
  console.log(`✓ Aircraft: ${aircraftData.length}`)

  // ─── Squawks ────────────────────────────────────────
  const squawksData = [
    {
      aircraftId: createdAircraft["N12345"],
      title: "Avionics fan noisy on startup",
      description: "Pilot reported grinding noise from avionics cooling fan during first 5 minutes. Noise goes away after warmup.",
      severity: "minor",
      category: "Avionics",
      ataChapter: "24",
      reportedBy: "J. Smith",
      estimatedHours: 1.5,
    },
    {
      aircraftId: createdAircraft["N12345"],
      title: "Left magneto drop exceeds limits",
      description: "During run-up, left mag drops 200+ RPM. Right mag within limits. Last plug inspection 50 hours ago.",
      severity: "major",
      category: "Engine",
      ataChapter: "74",
      reportedBy: "J. Smith",
      estimatedHours: 3.0,
      estimatedCost: 150.0,
    },
    {
      aircraftId: createdAircraft["N67890"],
      title: "Nosewheel shimmy on landing",
      description: "Nosewheel shimmy develops above 40 knots during landing rollout. Shimmy damper may need service.",
      severity: "major",
      category: "Landing Gear",
      ataChapter: "32",
      reportedBy: "T. Bradley",
      estimatedHours: 2.0,
    },
    {
      aircraftId: createdAircraft["N54321"],
      title: "ELT battery due for replacement",
      description: "ELT battery expiration date approaching. Need to replace before next annual.",
      severity: "minor",
      category: "Avionics",
      ataChapter: "25",
      reportedBy: "Shop inspection",
      estimatedHours: 0.5,
      estimatedCost: 85.0,
    },
    {
      aircraftId: createdAircraft["N98765"],
      title: "Alternator output low",
      description: "Bus voltage showing 13.2V in flight, should be 14.0V+. Alternator may need bench check or replacement.",
      severity: "critical",
      priority: 2,
      category: "Electrical",
      ataChapter: "24",
      reportedBy: "R. Johnson",
      estimatedHours: 4.0,
      estimatedCost: 800.0,
    },
    {
      aircraftId: createdAircraft["N11111"],
      title: "Oil leak at crankcase",
      description: "Visible oil seep at crankcase parting line, rear accessory section. Rate ~1qt/10hrs.",
      severity: "major",
      category: "Engine",
      ataChapter: "72",
      reportedBy: "M. Day",
      estimatedHours: 8.0,
    },
    {
      aircraftId: createdAircraft["N22222"],
      title: "Compass deviation card expired",
      description: "Compass swing due, deviation card is 18 months old.",
      severity: "minor",
      category: "Instruments",
      ataChapter: "34",
      reportedBy: "L. Chen",
      estimatedHours: 1.0,
    },
    {
      aircraftId: createdAircraft["N33333"],
      title: "Right main tire worn to cord",
      description: "Right main tire showing cord on outer edge. Needs immediate replacement before next flight.",
      severity: "critical",
      priority: 2,
      category: "Landing Gear",
      ataChapter: "32",
      reportedBy: "S. Chen",
      estimatedHours: 0.5,
      estimatedCost: 120.0,
    },
  ]

  for (const sq of squawksData) {
    await prisma.squawk.create({ data: sq as any })
  }
  console.log(`✓ Squawks: ${squawksData.length}`)

  // ─── Work Orders ────────────────────────────────────
  const wo1 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2602-001" },
    update: {},
    create: {
      woNumber: "WO2602-001",
      aircraftId: createdAircraft["N12345"],
      customerId: "cust-acme",
      title: "Annual Inspection",
      description: "Annual inspection per 14 CFR 43 Appendix D. Include all applicable ADs and service bulletins.",
      status: "in_progress",
      workType: "annual",
      priority: 0,
      scheduledStart: new Date("2026-02-03"),
      scheduledEnd: new Date("2026-02-10"),
      actualStart: new Date("2026-02-03"),
      hobbsIn: 1250.5,
      tachIn: 1180.2,
      estimatedLabor: 2850.0,
      estimatedParts: 450.0,
      assignedMechanic: "Ludwig Hellstrom",
    },
  })

  const wo2 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2602-002" },
    update: {},
    create: {
      woNumber: "WO2602-002",
      aircraftId: createdAircraft["N67890"],
      customerId: "cust-acme",
      title: "100 Hour Inspection + Shimmy Damper",
      description: "100 hour inspection. Also address nosewheel shimmy issue reported by pilot.",
      status: "open",
      workType: "100hr",
      priority: 0,
      scheduledStart: new Date("2026-02-12"),
      estimatedLabor: 1900.0,
      estimatedParts: 300.0,
    },
  })

  const wo3 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2602-003" },
    update: {},
    create: {
      woNumber: "WO2602-003",
      aircraftId: createdAircraft["N98765"],
      customerId: "cust-johnson",
      title: "Alternator R&R + Troubleshoot",
      description: "Remove and replace alternator, bench check old unit. Troubleshoot low bus voltage.",
      status: "pending_parts",
      workType: "unscheduled",
      priority: 2,
      scheduledStart: new Date("2026-02-06"),
      actualStart: new Date("2026-02-06"),
      hobbsIn: 450.3,
      tachIn: 425.1,
      estimatedLabor: 380.0,
      estimatedParts: 1200.0,
      assignedMechanic: "Mike Day",
      notes: "Waiting on alternator from Cirrus. ETA 2/10.",
    },
  })

  const wo4 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2601-004" },
    update: {},
    create: {
      woNumber: "WO2601-004",
      aircraftId: createdAircraft["N54321"],
      customerId: "cust-skyview",
      title: "Oil Change + Filter",
      description: "50-hour oil change with filter. Cut and inspect old filter.",
      status: "completed",
      workType: "unscheduled",
      priority: 0,
      scheduledStart: new Date("2026-01-28"),
      scheduledEnd: new Date("2026-01-28"),
      actualStart: new Date("2026-01-28"),
      actualEnd: new Date("2026-01-28"),
      hobbsIn: 2095.0,
      tachIn: 1980.0,
      hobbsOut: 2095.0,
      tachOut: 1980.0,
      estimatedLabor: 142.5,
      estimatedParts: 65.0,
      actualLabor: 142.5,
      actualParts: 58.0,
      assignedMechanic: "Sarah Chen",
    },
  })

  const wo5 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2602-005" },
    update: {},
    create: {
      woNumber: "WO2602-005",
      aircraftId: createdAircraft["N33333"],
      customerId: "cust-newengland",
      title: "Tire Replacement - Right Main",
      description: "Replace right main tire, worn to cord. Inspect brake assembly while wheel is off.",
      status: "in_progress",
      workType: "squawk",
      priority: 2,
      actualStart: new Date("2026-02-07"),
      hobbsIn: 5100.5,
      tachIn: 4800.3,
      estimatedLabor: 47.5,
      estimatedParts: 120.0,
      assignedMechanic: "Mike Day",
    },
  })

  const wo6 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2601-006" },
    update: {},
    create: {
      woNumber: "WO2601-006",
      aircraftId: createdAircraft["N22222"],
      customerId: "cust-newengland",
      title: "Annual Inspection",
      description: "Annual inspection, compass swing, AD compliance review.",
      status: "invoiced",
      workType: "annual",
      scheduledStart: new Date("2026-01-10"),
      actualStart: new Date("2026-01-10"),
      actualEnd: new Date("2026-01-16"),
      hobbsIn: 6180.0,
      tachIn: 5880.0,
      hobbsOut: 6180.0,
      tachOut: 5880.0,
      estimatedLabor: 2850.0,
      estimatedParts: 380.0,
      actualLabor: 3040.0,
      actualParts: 425.0,
      assignedMechanic: "Ludwig Hellstrom",
      inspector: "Sarah Chen",
    },
  })

  // Work order for N11111
  const wo7 = await prisma.workOrder.upsert({
    where: { woNumber: "WO2602-007" },
    update: {},
    create: {
      woNumber: "WO2602-007",
      aircraftId: createdAircraft["N11111"],
      customerId: "cust-newengland",
      title: "Engine Oil Leak Investigation",
      description: "Investigate and repair crankcase oil leak. Possible parting line reseal.",
      status: "draft",
      workType: "unscheduled",
      priority: 1,
      estimatedLabor: 760.0,
      estimatedParts: 200.0,
    },
  })

  console.log(`✓ Work Orders: 7`)

  // ─── Timesheet Entries ──────────────────────────────
  const timesheetData = [
    { userId: admin.id, workOrderId: wo1.id, description: "Annual inspection - intake/exhaust removal, inspection", hours: 6.0, workDate: new Date("2026-02-03"), taskType: "inspection", startTime: "08:00", endTime: "14:00" },
    { userId: admin.id, workOrderId: wo1.id, description: "Annual inspection - flight controls, landing gear", hours: 4.5, workDate: new Date("2026-02-04"), taskType: "inspection", startTime: "08:00", endTime: "12:30" },
    { userId: mechanic2.id, workOrderId: wo1.id, description: "Annual - avionics check, pitot-static", hours: 3.0, workDate: new Date("2026-02-04"), taskType: "inspection", startTime: "13:00", endTime: "16:00" },
    { userId: admin.id, workOrderId: wo1.id, description: "Annual - airframe inspection continue, fuel system", hours: 5.0, workDate: new Date("2026-02-05"), taskType: "inspection", startTime: "08:00", endTime: "13:00" },
    { userId: mechanic1.id, workOrderId: wo3.id, description: "Troubleshoot alternator - bench check, R&R", hours: 3.5, workDate: new Date("2026-02-06"), taskType: "troubleshoot", startTime: "09:00", endTime: "12:30" },
    { userId: mechanic1.id, workOrderId: wo3.id, description: "Wire harness inspection, connector cleaning", hours: 2.0, workDate: new Date("2026-02-06"), taskType: "repair", startTime: "13:30", endTime: "15:30" },
    { userId: mechanic2.id, workOrderId: wo4.id, description: "Oil change N54321 - drain, filter cut, refill", hours: 1.5, workDate: new Date("2026-01-28"), taskType: "repair", startTime: "08:00", endTime: "09:30" },
    { userId: mechanic1.id, workOrderId: wo5.id, description: "Tire R&R right main, brake inspection", hours: 0.5, workDate: new Date("2026-02-07"), taskType: "repair", startTime: "14:00", endTime: "14:30" },
    { userId: admin.id, workOrderId: wo6.id, description: "Annual inspection N22222 - day 1", hours: 8.0, workDate: new Date("2026-01-10"), taskType: "inspection", startTime: "07:00", endTime: "15:00" },
    { userId: admin.id, workOrderId: wo6.id, description: "Annual inspection N22222 - day 2", hours: 7.5, workDate: new Date("2026-01-13"), taskType: "inspection", startTime: "07:00", endTime: "14:30" },
    { userId: mechanic2.id, workOrderId: wo6.id, description: "IA inspection, return to service", hours: 4.0, workDate: new Date("2026-01-14"), taskType: "inspection", startTime: "08:00", endTime: "12:00" },
    { userId: admin.id, workOrderId: wo6.id, description: "Compass swing, paperwork, logbook entries", hours: 2.5, workDate: new Date("2026-01-15"), taskType: "paperwork", startTime: "09:00", endTime: "11:30" },
    // General shop time
    { userId: mechanic1.id, workOrderId: null, description: "Shop cleanup and tool inventory", hours: 2.0, workDate: new Date("2026-02-07"), taskType: "other", isBillable: false, startTime: "15:00", endTime: "17:00" },
    { userId: admin.id, workOrderId: null, description: "Parts ordering and vendor calls", hours: 1.0, workDate: new Date("2026-02-07"), taskType: "paperwork", isBillable: false, startTime: "15:00", endTime: "16:00" },
  ]

  for (const ts of timesheetData) {
    await prisma.timesheetEntry.create({
      data: {
        userId: ts.userId,
        shopId: shop.id,
        workOrderId: ts.workOrderId,
        description: ts.description,
        hours: ts.hours,
        workDate: ts.workDate,
        taskType: ts.taskType,
        startTime: ts.startTime,
        endTime: ts.endTime,
        isBillable: ts.isBillable ?? true,
        rate: 95.0,
        status: "approved",
      },
    })
  }
  console.log(`✓ Timesheets: ${timesheetData.length}`)

  // ─── Parts ──────────────────────────────────────────
  const partsData = [
    { partNumber: "LW-13568", description: "Oil Filter - Spin-on", manufacturer: "Lycoming", category: "Consumable", unitPrice: 28.50, minQuantity: 5, qty: 12 },
    { partNumber: "CH48110-1", description: "Champion Spark Plug - Massive Electrode", manufacturer: "Champion", category: "Consumable", unitPrice: 18.75, minQuantity: 16, qty: 24 },
    { partNumber: "MS35338-44", description: "AN4 Bolt, 7/16 length", manufacturer: "Military Standard", category: "Hardware", unitPrice: 0.85, minQuantity: 50, qty: 200 },
    { partNumber: "AE-105", description: "Aeroquip Hose Assembly - Brake", manufacturer: "Eaton Aeroquip", category: "Rotable", unitPrice: 145.00, minQuantity: 2, qty: 3 },
    { partNumber: "RA-D9A20-1", description: "Dry Air Pump", manufacturer: "Rapco", category: "Rotable", unitPrice: 485.00, minQuantity: 1, qty: 1 },
    { partNumber: "600-6-6", description: "Main Tire 6.00-6 6-ply", manufacturer: "Goodyear", category: "Expendable", unitPrice: 95.50, minQuantity: 2, qty: 4 },
    { partNumber: "5606A-QT", description: "MIL-PRF-5606 Hydraulic Fluid, Qt", manufacturer: "AeroShell", category: "Consumable", unitPrice: 12.00, minQuantity: 6, qty: 8 },
    { partNumber: "W100-QT", description: "AeroShell W100 Oil, Qt", manufacturer: "AeroShell", category: "Consumable", unitPrice: 9.50, minQuantity: 12, qty: 24 },
    { partNumber: "500-052-3-6", description: "ELT Battery Pack", manufacturer: "Artex", category: "Consumable", unitPrice: 82.00, minQuantity: 1, qty: 2, isShelfLife: true },
    { partNumber: "AN960-416", description: "AN Washer, #4", manufacturer: "Military Standard", category: "Hardware", unitPrice: 0.15, minQuantity: 100, qty: 500 },
    { partNumber: "0454009-5", description: "Exhaust Gasket Set - O-360", manufacturer: "Lycoming", category: "Consumable", unitPrice: 45.00, minQuantity: 2, qty: 1 },
    { partNumber: "SW-210", description: "Safety Wire .032 - 1lb spool", manufacturer: "Malin", category: "Consumable", unitPrice: 22.00, minQuantity: 3, qty: 5 },
  ]

  for (const p of partsData) {
    const part = await prisma.part.upsert({
      where: { partNumber: p.partNumber },
      update: {},
      create: {
        shopId: shop.id,
        partNumber: p.partNumber,
        description: p.description,
        manufacturer: p.manufacturer,
        category: p.category,
        unitPrice: p.unitPrice,
        minQuantity: p.minQuantity,
        isSerialized: false,
        isShelfLife: p.isShelfLife || false,
      },
    })

    // Create inventory
    await prisma.inventoryItem.create({
      data: {
        partId: part.id,
        quantity: p.qty,
        unitPrice: p.unitPrice,
        condition: "NEW",
        location: "Main Parts Room",
        receivedDate: new Date("2026-01-15"),
      },
    })
  }
  console.log(`✓ Parts: ${partsData.length}`)

  // ─── AD Compliance ──────────────────────────────────
  const adData = [
    {
      aircraftId: createdAircraft["N12345"],
      adNumber: "2023-26-12",
      adTitle: "Lycoming Engines - Fuel Injection Servo",
      status: "complied",
      complianceDate: new Date("2024-06-15"),
      complianceHours: 1100.0,
      methodOfCompliance: "Inspected per AD requirements. No discrepancies found.",
      compliedBy: "L. Hellstrom, AP",
    },
    {
      aircraftId: createdAircraft["N12345"],
      adNumber: "2024-08-05",
      adTitle: "Cessna 172 - Fuel Tank Straps",
      status: "recurring",
      complianceDate: new Date("2025-03-01"),
      complianceHours: 1150.0,
      nextDueDate: new Date("2026-03-01"),
      nextDueHours: 1350.0,
      intervalHours: 200,
      intervalMonths: 12,
      methodOfCompliance: "Inspected fuel tank straps per AD. Complied.",
      compliedBy: "L. Hellstrom, AP",
    },
    {
      aircraftId: createdAircraft["N12345"],
      adNumber: "2025-15-03",
      adTitle: "McCauley Propeller - Hub Inspection",
      status: "open",
      notes: "Due at next annual or 1300 hours, whichever comes first.",
    },
    {
      aircraftId: createdAircraft["N67890"],
      adNumber: "2022-14-06",
      adTitle: "Piper PA-28 - Wing Spar Inspection",
      status: "complied",
      complianceDate: new Date("2023-11-01"),
      methodOfCompliance: "Spar inspection completed per AD. No cracks found.",
      compliedBy: "S. Chen, IA",
    },
    {
      aircraftId: createdAircraft["N98765"],
      adNumber: "2024-22-11",
      adTitle: "Cirrus SR22 - Parachute Repack",
      status: "recurring",
      complianceDate: new Date("2025-06-01"),
      nextDueDate: new Date("2035-06-01"),
      intervalMonths: 120,
      methodOfCompliance: "CAPS repack performed by BRS authorized facility.",
      compliedBy: "BRS Authorized Center",
    },
  ]

  for (const ad of adData) {
    // Use upsert with compound key
    await prisma.aDCompliance.upsert({
      where: {
        aircraftId_adNumber: {
          aircraftId: ad.aircraftId,
          adNumber: ad.adNumber,
        },
      },
      update: {},
      create: ad as any,
    })
  }
  console.log(`✓ AD Compliance: ${adData.length}`)

  // ─── Equipment ──────────────────────────────────────
  const equipmentData = [
    { aircraftId: createdAircraft["N12345"], equipmentType: "Engine", manufacturer: "Lycoming", model: "IO-360-L2A", serialNumber: "L-12345-51A", position: "Single" },
    { aircraftId: createdAircraft["N12345"], equipmentType: "Propeller", manufacturer: "McCauley", model: "1C235/LFA7570", serialNumber: "MC-98765", position: "Single" },
    { aircraftId: createdAircraft["N67890"], equipmentType: "Engine", manufacturer: "Lycoming", model: "O-360-A4M", serialNumber: "L-67890-28", position: "Single" },
    { aircraftId: createdAircraft["N54321"], equipmentType: "Engine", manufacturer: "Lycoming", model: "IO-540-AB1A5", serialNumber: "L-54321-99", position: "Single" },
    { aircraftId: createdAircraft["N98765"], equipmentType: "Engine", manufacturer: "Continental", model: "IO-550-N", serialNumber: "C-98765-01", position: "Single" },
    { aircraftId: createdAircraft["N98765"], equipmentType: "Propeller", manufacturer: "Hartzell", model: "PHC-J3YF-1RF/F7693B", serialNumber: "HZ-44332", position: "Single" },
  ]

  for (const eq of equipmentData) {
    await prisma.equipment.create({ data: eq })
  }
  console.log(`✓ Equipment: ${equipmentData.length}`)

  console.log("\n✅ Seed complete!")
  console.log("\n📧 Login credentials:")
  console.log("   Email: admin@demo.com / mike@demo.com / sarah@demo.com")
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
