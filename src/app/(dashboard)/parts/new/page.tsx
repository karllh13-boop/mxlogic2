"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Package } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

export default function NewPartPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      partNumber: formData.get("partNumber"),
      description: formData.get("description") || null,
      manufacturer: formData.get("manufacturer") || null,
      category: formData.get("category") || null,
      unitOfMeasure: formData.get("unitOfMeasure") || "ea",
      unitPrice: formData.get("unitPrice") ? parseFloat(formData.get("unitPrice") as string) : 0,
      minQuantity: formData.get("minQuantity") ? parseFloat(formData.get("minQuantity") as string) : 0,
      reorderQuantity: formData.get("reorderQuantity") ? parseFloat(formData.get("reorderQuantity") as string) : null,
      preferredVendor: formData.get("preferredVendor") || null,
      isSerialized: formData.get("isSerialized") === "on",
      isShelfLife: formData.get("isShelfLife") === "on",
      initialQuantity: formData.get("initialQuantity") ? parseFloat(formData.get("initialQuantity") as string) : 0,
      location: formData.get("location") || null,
      notes: formData.get("notes") || null,
    }

    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create part")
      }
      const part = await res.json()
      toast.success("Part created successfully")
      router.push("/parts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to create part")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link href="/parts" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
          <Package className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Part</h1>
          <p className="text-gray-500">Add a new part to your catalog</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Part Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number *</label>
              <input type="text" name="partNumber" required placeholder="P/N-12345" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input type="text" name="manufacturer" placeholder="Lycoming" className="input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" name="description" placeholder="Oil Filter" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" className="input w-full">
                <option value="">Select...</option>
                <option value="Hardware">Hardware</option>
                <option value="Consumable">Consumable</option>
                <option value="Rotable">Rotable</option>
                <option value="Expendable">Expendable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <select name="unitOfMeasure" defaultValue="ea" className="input w-full">
                <option value="ea">Each</option>
                <option value="ft">Feet</option>
                <option value="in">Inches</option>
                <option value="gal">Gallon</option>
                <option value="qt">Quart</option>
                <option value="lb">Pound</option>
                <option value="oz">Ounce</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input type="number" name="unitPrice" step="0.01" min="0" defaultValue="0" className="input w-full pl-7" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input type="number" name="minQuantity" min="0" defaultValue="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
              <input type="number" name="reorderQuantity" min="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Vendor</label>
              <input type="text" name="preferredVendor" placeholder="Aircraft Spruce" className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Initial Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input type="number" name="initialQuantity" min="0" defaultValue="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
              <input type="text" name="location" placeholder="Shelf A-3" className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="isSerialized" className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Serialized (track individual serial numbers)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="isShelfLife" className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Shelf Life (track expiration dates)</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea name="notes" rows={3} placeholder="Any notes about this part..." className="input w-full" />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/parts" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />{loading ? "Creating..." : "Create Part"}
          </button>
        </div>
      </form>
    </div>
  )
}
