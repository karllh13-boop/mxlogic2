import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Printer, Download, Mail } from "lucide-react"

export default async function InvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const workOrder = await prisma.workOrder.findFirst({
    where: {
      id: params.id,
      aircraft: { shopId },
    },
    include: {
      aircraft: {
        include: { shop: true },
      },
      customer: true,
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
      timesheetEntries: {
        where: { status: "approved", isBillable: true },
        include: { user: true },
        orderBy: { workDate: "asc" },
      },
      squawks: true,
    },
  })

  if (!workOrder) {
    notFound()
  }

  const shop = workOrder.aircraft.shop

  // Calculate labor from timesheets
  const laborEntries = workOrder.timesheetEntries.map((ts) => ({
    date: ts.workDate,
    mechanic: `${ts.user.firstName} ${ts.user.lastName}`,
    description: ts.description || ts.taskType || "Labor",
    hours: ts.hours,
    rate: ts.rate || shop.laborRate,
    total: ts.hours * (ts.rate || shop.laborRate),
  }))

  const laborTotal = laborEntries.reduce((sum, e) => sum + e.total, 0)
  const laborHours = laborEntries.reduce((sum, e) => sum + e.hours, 0)

  // Calculate parts from line items
  const partsEntries = workOrder.lineItems
    .filter((li) => li.itemType === "parts")
    .map((li) => ({
      partNumber: li.partNumber || "-",
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice || 0,
      total: li.quantity * (li.unitPrice || 0),
    }))

  const partsTotal = partsEntries.reduce((sum, e) => sum + e.total, 0)

  // Subcontract items
  const subcontractEntries = workOrder.lineItems
    .filter((li) => li.itemType === "subcontract")
    .map((li) => ({
      description: li.description,
      total: li.quantity * (li.unitPrice || 0),
    }))

  const subcontractTotal = subcontractEntries.reduce((sum, e) => sum + e.total, 0)

  const grandTotal = laborTotal + partsTotal + subcontractTotal

  // Invoice number based on WO number
  const invoiceNumber = workOrder.woNumber.replace("WO", "INV")
  const invoiceDate = workOrder.actualEnd || new Date()

  return (
    <div className="space-y-6">
      {/* Action Bar - not printed */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-500">{workOrder.woNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {workOrder.customer?.email && (
            <a
              href={`mailto:${workOrder.customer.email}?subject=Invoice ${invoiceNumber} - ${shop.name}&body=Please find attached your invoice for work order ${workOrder.woNumber}.`}
              className="btn btn-secondary"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </a>
          )}
          <button
            onClick={() => {}}
            className="btn btn-secondary"
            id="print-btn"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto print:shadow-none print:border-0 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-300">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{shop.name}</h2>
            {shop.faaRepairStation && (
              <p className="text-gray-600 mt-1">
                FAA Repair Station {shop.faaRepairStation}
              </p>
            )}
            {shop.address && (
              <p className="text-gray-500 mt-1">{shop.address}</p>
            )}
            {shop.phone && (
              <p className="text-gray-500">{shop.phone}</p>
            )}
            {shop.email && (
              <p className="text-gray-500">{shop.email}</p>
            )}
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-primary-600">INVOICE</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Invoice #:</span>{" "}
                <span className="font-medium">{invoiceNumber}</span>
              </p>
              <p>
                <span className="text-gray-500">Date:</span>{" "}
                <span className="font-medium">
                  {new Date(invoiceDate).toLocaleDateString()}
                </span>
              </p>
              <p>
                <span className="text-gray-500">WO #:</span>{" "}
                <span className="font-medium">{workOrder.woNumber}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Aircraft */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bill To
            </h4>
            {workOrder.customer ? (
              <div>
                <p className="font-medium text-gray-900">
                  {workOrder.customer.name}
                </p>
                {workOrder.customer.contactName && (
                  <p className="text-gray-600">
                    Attn: {workOrder.customer.contactName}
                  </p>
                )}
                {workOrder.customer.address && (
                  <p className="text-gray-600">{workOrder.customer.address}</p>
                )}
                <p className="text-gray-600">
                  {workOrder.customer.city && `${workOrder.customer.city}, `}
                  {workOrder.customer.state} {workOrder.customer.zipCode}
                </p>
                {workOrder.customer.email && (
                  <p className="text-gray-600">{workOrder.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No customer assigned</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Aircraft
            </h4>
            <div>
              <p className="font-medium text-gray-900">
                {workOrder.aircraft.nNumber}
              </p>
              <p className="text-gray-600">
                {workOrder.aircraft.year} {workOrder.aircraft.manufacturer}{" "}
                {workOrder.aircraft.model}
              </p>
              {workOrder.aircraft.serialNumber && (
                <p className="text-gray-600">
                  S/N: {workOrder.aircraft.serialNumber}
                </p>
              )}
              {workOrder.hobbsIn && (
                <p className="text-gray-600">
                  Hobbs: {workOrder.hobbsIn}
                  {workOrder.hobbsOut && ` → ${workOrder.hobbsOut}`}
                </p>
              )}
              {workOrder.tachIn && (
                <p className="text-gray-600">
                  Tach: {workOrder.tachIn}
                  {workOrder.tachOut && ` → ${workOrder.tachOut}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Work Description */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Work Performed
          </h4>
          <p className="text-gray-900 font-medium">{workOrder.title}</p>
          {workOrder.description && (
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">
              {workOrder.description}
            </p>
          )}
        </div>

        {/* Labor Section */}
        {laborEntries.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Labor
            </h4>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Mechanic
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Hours
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Rate
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {laborEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-sm">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-sm">{entry.mechanic}</td>
                    <td className="py-2 text-sm">{entry.description}</td>
                    <td className="py-2 text-sm text-right">
                      {entry.hours.toFixed(1)}
                    </td>
                    <td className="py-2 text-sm text-right">
                      ${entry.rate.toFixed(2)}
                    </td>
                    <td className="py-2 text-sm text-right font-medium">
                      ${entry.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td
                    colSpan={3}
                    className="py-2 text-sm font-medium text-gray-700"
                  >
                    Labor Subtotal
                  </td>
                  <td className="py-2 text-sm text-right font-medium">
                    {laborHours.toFixed(1)}h
                  </td>
                  <td></td>
                  <td className="py-2 text-sm text-right font-bold">
                    ${laborTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Parts Section */}
        {partsEntries.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Parts & Materials
            </h4>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Part Number
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Qty
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Unit Price
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {partsEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-sm font-mono">
                      {entry.partNumber}
                    </td>
                    <td className="py-2 text-sm">{entry.description}</td>
                    <td className="py-2 text-sm text-right">
                      {entry.quantity}
                    </td>
                    <td className="py-2 text-sm text-right">
                      ${entry.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 text-sm text-right font-medium">
                      ${entry.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td
                    colSpan={4}
                    className="py-2 text-sm font-medium text-gray-700"
                  >
                    Parts Subtotal
                  </td>
                  <td className="py-2 text-sm text-right font-bold">
                    ${partsTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Subcontract Section */}
        {subcontractEntries.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Subcontract / Other
            </h4>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {subcontractEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-sm">{entry.description}</td>
                    <td className="py-2 text-sm text-right font-medium">
                      ${entry.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-2 text-sm font-medium text-gray-700">
                    Subcontract Subtotal
                  </td>
                  <td className="py-2 text-sm text-right font-bold">
                    ${subcontractTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* If no labor or parts entries, show estimate-based summary */}
        {laborEntries.length === 0 && partsEntries.length === 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm mb-4">
              No detailed line items recorded. Showing estimates:
            </p>
            <div className="space-y-2">
              {workOrder.estimatedLabor && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Estimated Labor</span>
                  <span className="font-medium">
                    ${workOrder.estimatedLabor.toFixed(2)}
                  </span>
                </div>
              )}
              {workOrder.estimatedParts && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Estimated Parts</span>
                  <span className="font-medium">
                    ${workOrder.estimatedParts.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t-2 border-gray-900 pt-4 mt-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Payment is due upon receipt of invoice.
              </p>
              <p className="text-sm text-gray-500">
                Thank you for choosing {shop.name}.
              </p>
            </div>
            <div className="text-right">
              {laborTotal > 0 && (
                <div className="flex justify-between gap-12 text-sm mb-1">
                  <span className="text-gray-600">Labor:</span>
                  <span>${laborTotal.toFixed(2)}</span>
                </div>
              )}
              {partsTotal > 0 && (
                <div className="flex justify-between gap-12 text-sm mb-1">
                  <span className="text-gray-600">Parts:</span>
                  <span>${partsTotal.toFixed(2)}</span>
                </div>
              )}
              {subcontractTotal > 0 && (
                <div className="flex justify-between gap-12 text-sm mb-1">
                  <span className="text-gray-600">Subcontract:</span>
                  <span>${subcontractTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between gap-12 text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                <span>Total Due:</span>
                <span>
                  $
                  {grandTotal > 0
                    ? grandTotal.toFixed(2)
                    : (
                        (workOrder.estimatedLabor || 0) +
                        (workOrder.estimatedParts || 0)
                      ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>
            {shop.name}
            {shop.faaRepairStation &&
              ` • FAA Repair Station ${shop.faaRepairStation}`}
          </p>
          <p>
            {shop.address} • {shop.phone} • {shop.email}
          </p>
        </div>
      </div>

      {/* Print Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('print-btn')?.addEventListener('click', function() {
            window.print();
          });
        `,
        }}
      />
    </div>
  )
}
