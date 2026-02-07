import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { 
  FileText, Download, TrendingUp, DollarSign, Clock, Plane, 
  ClipboardList, Calendar, BarChart3, PieChart 
} from "lucide-react"

export default async function ReportsPage() {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  // Get some quick stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    monthlyWorkOrders,
    yearlyWorkOrders,
    monthlyHours,
    activeAircraft,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: {
        aircraft: { shopId },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.workOrder.count({
      where: {
        aircraft: { shopId },
        createdAt: { gte: startOfYear },
      },
    }),
    prisma.timesheetEntry.aggregate({
      where: {
        shopId,
        workDate: { gte: startOfMonth },
        status: "approved",
      },
      _sum: { hours: true },
    }),
    prisma.aircraft.count({
      where: { shopId, isActive: true },
    }),
  ])

  const reportCategories = [
    {
      title: "Work Order Reports",
      icon: ClipboardList,
      color: "bg-blue-500",
      reports: [
        { name: "Work Order Summary", href: "/reports/work-orders/summary", description: "Overview of all work orders by status" },
        { name: "Work Order Detail", href: "/reports/work-orders/detail", description: "Detailed breakdown by aircraft" },
        { name: "Open Work Orders", href: "/reports/work-orders/open", description: "Currently active work orders" },
        { name: "Completed This Month", href: "/reports/work-orders/monthly", description: "Work completed in current month" },
      ],
    },
    {
      title: "Financial Reports",
      icon: DollarSign,
      color: "bg-green-500",
      reports: [
        { name: "Revenue Summary", href: "/reports/financial/revenue", description: "Revenue by period and customer" },
        { name: "Labor Report", href: "/reports/financial/labor", description: "Labor hours and billing" },
        { name: "Parts Usage", href: "/reports/financial/parts", description: "Parts costs and inventory value" },
        { name: "Invoice Aging", href: "/reports/financial/aging", description: "Outstanding invoices" },
      ],
    },
    {
      title: "Aircraft Reports",
      icon: Plane,
      color: "bg-purple-500",
      reports: [
        { name: "Fleet Status", href: "/reports/aircraft/fleet", description: "Overview of all aircraft" },
        { name: "Maintenance Due", href: "/reports/aircraft/due", description: "Upcoming inspections and ADs" },
        { name: "Squawk History", href: "/reports/aircraft/squawks", description: "Historical squawk data" },
        { name: "Timer Report", href: "/reports/aircraft/timers", description: "Hours and cycles tracking" },
      ],
    },
    {
      title: "Timesheet Reports",
      icon: Clock,
      color: "bg-yellow-500",
      reports: [
        { name: "Weekly Timesheet", href: "/reports/timesheets/weekly", description: "Hours by employee per week" },
        { name: "Billable vs Non-Billable", href: "/reports/timesheets/billable", description: "Billable hour breakdown" },
        { name: "Productivity", href: "/reports/timesheets/productivity", description: "Efficiency metrics" },
        { name: "Payroll Export", href: "/reports/timesheets/payroll", description: "Export for payroll processing" },
      ],
    },
    {
      title: "Compliance Reports",
      icon: FileText,
      color: "bg-red-500",
      reports: [
        { name: "AD Status", href: "/reports/compliance/ads", description: "AD compliance by aircraft" },
        { name: "Inspection Due List", href: "/reports/compliance/inspections", description: "Upcoming required inspections" },
        { name: "Logbook Summary", href: "/reports/compliance/logbook", description: "Logbook entries by aircraft" },
        { name: "8610-2 Forms", href: "/reports/compliance/8610", description: "FAA form 8610-2 records" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and export shop reports</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <ClipboardList className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">WOs This Month</p>
              <p className="text-2xl font-bold text-blue-900">{monthlyWorkOrders}</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">WOs This Year</p>
              <p className="text-2xl font-bold text-green-900">{yearlyWorkOrders}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">Hours This Month</p>
              <p className="text-2xl font-bold text-yellow-900">
                {(monthlyHours._sum.hours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <Plane className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Active Aircraft</p>
              <p className="text-2xl font-bold text-purple-900">{activeAircraft}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      {reportCategories.map((category) => (
        <div key={category.title} className="card">
          <div className="flex items-center mb-4">
            <div className={`${category.color} p-2 rounded-lg mr-3`}>
              <category.icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {category.reports.map((report) => (
              <Link
                key={report.name}
                href={report.href}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">{report.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-gray-500 p-2 rounded-lg mr-3">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Custom Reports</h2>
          </div>
          <Link href="/reports/builder" className="btn btn-primary">
            Report Builder
          </Link>
        </div>
        <p className="text-gray-500">
          Create custom reports with the report builder. Select data fields, filters, 
          and output formats to generate exactly the report you need.
        </p>
      </div>
    </div>
  )
}
