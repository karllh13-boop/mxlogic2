import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Package,
  AlertTriangle,
  Boxes,
  DollarSign,
  Tag,
  MapPin,
} from "lucide-react"

const conditionColors: Record<string, string> = {
  NEW: "badge-success",
  OH: "badge-info",
  SV: "badge-warning",
  AR: "badge-gray",
}

export default async function PartDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const shopId = session?.user?.shopId

  if (!shopId) {
    return <div>Error: No shop found</div>
  }

  const part = await prisma.part.findFirst({
    where: {
      id: params.id,
      shopId,
    },
    include: {
      inventoryItems: {
        where: { isActive: true },
        orderBy: { receivedDate: "desc" },
      },
    },
  })

  if (!part) {
    notFound()
  }

  const totalQty = part.inventoryItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )
  const totalValue = part.inventoryItems.reduce(
    (sum, item) => sum + item.quantity * (item.unitPrice || part.unitPrice),
    0
  )
  const isLowStock = totalQty < part.minQuantity

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/parts"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {part.partNumber}
            </h1>
            <p className="text-gray-500">{part.description || "No description"}</p>
          </div>
        </div>
        <Link
          href={`/parts/${part.id}/edit`}
          className="btn btn-secondary"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Link>
      </div>

      {/* Low Stock Alert */}
      {isLowStock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">
                Below minimum stock level
              </p>
              <p className="text-sm text-yellow-600">
                Current: {totalQty} {part.unitOfMeasure} / Min: {part.minQuantity}{" "}
                {part.unitOfMeasure}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Boxes className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">On Hand</p>
              <p className="text-2xl font-bold text-blue-900">
                {totalQty} {part.unitOfMeasure}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Unit Price</p>
              <p className="text-2xl font-bold text-green-900">
                ${part.unitPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-900">
                ${totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-2xl font-bold text-gray-900">
                {part.category || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Part Details & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Part Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Part Number</p>
                <p className="font-medium">{part.partNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Manufacturer</p>
                <p className="font-medium">{part.manufacturer || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{part.category || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit of Measure</p>
                <p className="font-medium">{part.unitOfMeasure}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serialized</p>
                <p className="font-medium">{part.isSerialized ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shelf Life Tracked</p>
                <p className="font-medium">{part.isShelfLife ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Inventory Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Inventory Items
              </h2>
              <span className="text-sm text-gray-500">
                {part.inventoryItems.length} batches
              </span>
            </div>
            {part.inventoryItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                        Location
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                        S/N / Lot
                      </th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">
                        Condition
                      </th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">
                        Qty
                      </th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">
                        Value
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                        Received
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.inventoryItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 text-sm">
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                            {item.location || "-"}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {item.serialNumber || item.lotNumber || "-"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`badge ${conditionColors[item.condition]}`}
                          >
                            {item.condition}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          $
                          {(
                            item.quantity * (item.unitPrice || part.unitPrice)
                          ).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-500">
                          {item.receivedDate
                            ? new Date(item.receivedDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No inventory on hand</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Stocking & Vendor */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Stocking
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Min Quantity</span>
                <span className="font-medium">
                  {part.minQuantity} {part.unitOfMeasure}
                </span>
              </div>
              {part.reorderQuantity && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Reorder Qty</span>
                  <span className="font-medium">
                    {part.reorderQuantity} {part.unitOfMeasure}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">On Hand</span>
                <span
                  className={`font-medium ${isLowStock ? "text-red-600" : "text-green-600"}`}
                >
                  {totalQty} {part.unitOfMeasure}
                </span>
              </div>
            </div>
          </div>

          {part.preferredVendor && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Vendor
              </h2>
              <p className="font-medium text-gray-900">
                {part.preferredVendor}
              </p>
            </div>
          )}

          {part.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Notes
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{part.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
