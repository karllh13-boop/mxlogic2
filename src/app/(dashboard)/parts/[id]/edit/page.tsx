"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Package, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function EditPartPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    partNumber: "",
    description: "",
    manufacturer: "",
    category: "",
    unitOfMeasure: "ea",
    unitPrice: "",
    minQuantity: "",
    reorderQuantity: "",
    preferredVendor: "",
    isSerialized: false,
    isShelfLife: false,
    notes: "",
  })

  useEffect(() => {
    fetch(`/api/parts/${params.id}`)
      .then(r => r.json())
      .then(part => {
        setFormData({
          partNumber: part.partNumber || "",
          description: part.description || "",
          manufacturer: part.manufacturer || "",
          category: part.category || "",
          unitOfMeasure: part.unitOfMeasure || "ea",
          unitPrice: part.unitPrice?.toString() || "0",
          minQuantity: part.minQuantity?.toString() || "0",
          reorderQuantity: part.reorderQuantity?.toString() || "",
          preferredVendor: part.preferredVendor || "",
          isSerialized: part.isSerialized || false,
          isShelfLife: part.isShelfLife || false,
          notes: part.notes || "",
        })
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load part")
        setLoading(false)
      })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/parts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partNumber: formData.partNumber,
          description: formData.description || null,
          manufacturer: formData.manufacturer || null,
          category: formData.category || null,
          unitOfMeasure: formData.unitOfMeasure,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          minQuantity: parseFloat(formData.minQuantity) || 0,
          reorderQuantity: formData.reorderQuantity ? parseFloat(formData.reorderQuantity) : null,
          preferredVendor: formData.preferredVendor || null,
          isSerialized: formData.isSerialized,
          isShelfLife: formData.isShelfLife,
          notes: formData.notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update")
      }
      toast.success("Part updated successfully")
      router.push("/parts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to update part")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/parts/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Part deactivated")
      router.push("/parts")
    } catch {
      toast.error("Failed to delete part")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  function u(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="animate-pulse space-y-6"><div className="h-10 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /></div></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/parts" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Part</h1>
            <p className="text-gray-500">{formData.partNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteDialog(true)} className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300">
          <Trash2 className="w-4 h-4 mr-2" />Delete
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Part Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part Number *</label>
              <input type="text" value={formData.partNumber} onChange={e => u("partNumber", e.target.value)} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input type="text" value={formData.manufacturer} onChange={e => u("manufacturer", e.target.value)} className="input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={formData.description} onChange={e => u("description", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category} onChange={e => u("category", e.target.value)} className="input w-full">
                <option value="">Select...</option>
                <option value="Hardware">Hardware</option>
                <option value="Consumable">Consumable</option>
                <option value="Rotable">Rotable</option>
                <option value="Expendable">Expendable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <select value={formData.unitOfMeasure} onChange={e => u("unitOfMeasure", e.target.value)} className="input w-full">
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
              <input type="number" value={formData.unitPrice} onChange={e => u("unitPrice", e.target.value)} step="0.01" min="0" className="input w-full pl-7" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input type="number" value={formData.minQuantity} onChange={e => u("minQuantity", e.target.value)} min="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
              <input type="number" value={formData.reorderQuantity} onChange={e => u("reorderQuantity", e.target.value)} min="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Vendor</label>
              <input type="text" value={formData.preferredVendor} onChange={e => u("preferredVendor", e.target.value)} className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={formData.isSerialized} onChange={e => u("isSerialized", e.target.checked)} className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Serialized (track individual serial numbers)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={formData.isShelfLife} onChange={e => u("isShelfLife", e.target.checked)} className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Shelf Life (track expiration dates)</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea value={formData.notes} onChange={e => u("notes", e.target.value)} rows={3} className="input w-full" />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/parts" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Part"
        message={`Are you sure you want to deactivate P/N ${formData.partNumber}? The part will be hidden but data preserved.`}
        confirmText="Deactivate"
        loading={deleting}
      />
    </div>
  )
}
