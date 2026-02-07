import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, Boxes, Search, AlertCircle, Calendar } from "lucide-react"

const conditionColors: Record<string, string> = {
  NEW: "badge-success",
  OH: "badge-info",
  SV: "badge-warning",
  AR: "badge-gray",
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { q?: string; condition?: string; expiring?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, condition, expiring } = searchParams

  // Get parts for this shop to filter inventory
  const shopPartIds = await prisma.part.findMany({
    where: { shopId },
    select: { id: true },
  }).then(parts => parts.map(p => p.id))

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const inventory = await prisma.inventoryItem.findMany({
    where: {
      partId: { in: shopPartIds },
      isActive: true,
      quantity: { gt: 0 },
      ...(condition ? { condition } : {}),
      ...(expiring === "true" ? {
        expirationDate: { lte: thirtyDaysFromNow },
      } : {}),
      ...(q ? {
        OR: [
          { part: { partNumber: { contains: q } } },
          { part: { description: { contains: q } } },
          { serialNumber: { contains: q } },
          { lotNumber: { contains: q } },
          { location: { contains: q } },
        ],
      } : {}),
    },
    include: {
      part: true,
    },
    orderBy: { receivedDate: "desc" },
  })

  // Calculate expiring items count
  const expiringCount = inventory.filter(item => 
    item.expirationDate && item.expirationDate <= thirtyDaysFromNow
  ).length

  // Calculate total value
  const totalValue = inventory.reduce((sum, item) => {
    const price = item.unitPrice || item.part.unitPrice
    return sum + (item.quantity * price)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">
            {inventory.length} items • ${totalValue.toLocaleString()} total value
          </p>
        </div>
        <Link href="/inventory/receive" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Receive Parts
        </Link>
      </div>

      {/* Expiring Alert */}
      {expiringCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">
                {expiringCount} items expiring within 30 days
              </p>
              <Link 
                href="/inventory?expiring=true" 
                className="text-sm text-red-600 hover:text-red-700"
              >
                View expiring items →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search P/N, S/N, lot, location..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="condition" defaultValue={condition} className="input w-auto">
            <option value="">All Conditions</option>
            <option value="NEW">New</option>
            <option value="OH">Overhauled</option>
            <option value="SV">Serviceable</option>
            <option value="AR">As Removed</option>
          </select>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="expiring" 
              value="true"
              defaultChecked={expiring === "true"}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Expiring soon</span>
          </label>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="card">
        {inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Part Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">S/N / Lot</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Condition</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Qty</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Expires</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isExpiring = item.expirationDate && item.expirationDate <= thirtyDaysFromNow
                  const price = item.unitPrice || item.part.unitPrice
                  const value = item.quantity * price
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        isExpiring ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/parts/${item.part.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {item.part.partNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{item.part.description || "-"}</td>
                      <td className="py-3 px-4">
                        {item.serialNumber && (
                          <span className="font-mono text-sm">{item.serialNumber}</span>
                        )}
                        {item.lotNumber && (
                          <span className="text-sm text-gray-500 block">Lot: {item.lotNumber}</span>
                        )}
                        {!item.serialNumber && !item.lotNumber && "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.location || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${conditionColors[item.condition]}`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {item.quantity} {item.part.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4">
                        {item.expirationDate ? (
                          <span className={isExpiring ? "text-red-600 font-medium" : ""}>
                            {new Date(item.expirationDate).toLocaleDateString()}
                            {isExpiring && <AlertCircle className="w-4 h-4 inline ml-1" />}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        ${value.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No inventory items found</p>
            <Link href="/inventory/receive" className="btn btn-primary">
              Receive your first parts
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
