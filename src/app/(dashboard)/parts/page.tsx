import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus, Package, Search, AlertTriangle } from "lucide-react"

export default async function PartsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; lowStock?: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const { q, category, lowStock } = searchParams

  const parts = await prisma.part.findMany({
    where: {
      shopId,
      isActive: true,
      ...(category ? { category } : {}),
      ...(q ? {
        OR: [
          { partNumber: { contains: q } },
          { description: { contains: q } },
          { manufacturer: { contains: q } },
        ],
      } : {}),
    },
    include: {
      inventoryItems: {
        where: { isActive: true },
      },
    },
    orderBy: { partNumber: "asc" },
  })

  // Calculate stock levels
  const partsWithStock = parts.map((part) => {
    const totalQty = part.inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
    const isLowStock = totalQty < part.minQuantity
    return { ...part, totalQty, isLowStock }
  })

  const filteredParts = lowStock === "true" 
    ? partsWithStock.filter(p => p.isLowStock)
    : partsWithStock

  const lowStockCount = partsWithStock.filter(p => p.isLowStock).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Catalog</h1>
          <p className="text-gray-500">{parts.length} parts in catalog</p>
        </div>
        <Link href="/parts/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Part
        </Link>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">
                {lowStockCount} parts below minimum stock level
              </p>
              <Link 
                href="/parts?lowStock=true" 
                className="text-sm text-yellow-600 hover:text-yellow-700"
              >
                View low stock items →
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
                placeholder="Search P/N, description, manufacturer..."
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select name="category" defaultValue={category} className="input w-auto">
            <option value="">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Consumable">Consumable</option>
            <option value="Rotable">Rotable</option>
            <option value="Expendable">Expendable</option>
          </select>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="lowStock" 
              value="true"
              defaultChecked={lowStock === "true"}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Low stock only</span>
          </label>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Parts Table */}
      <div className="card">
        {filteredParts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Part Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Manufacturer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">On Hand</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Min Qty</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr 
                    key={part.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      part.isLowStock ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/parts/${part.id}/edit`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {part.partNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{part.description || "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{part.manufacturer || "-"}</td>
                    <td className="py-3 px-4">
                      {part.category && (
                        <span className="badge badge-gray">{part.category}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={part.isLowStock ? "text-red-600 font-medium" : ""}>
                        {part.totalQty} {part.unitOfMeasure}
                      </span>
                      {part.isLowStock && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 inline ml-2" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      {part.minQuantity} {part.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${part.unitPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No parts found</p>
            <Link href="/parts/new" className="btn btn-primary">
              Add your first part
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
