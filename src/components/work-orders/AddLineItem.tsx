"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Package, Clock, Wrench } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface AddLineItemProps {
  workOrderId: string
  shopLaborRate: number
}

export function AddLineItem({ workOrderId, shopLaborRate }: AddLineItemProps) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [itemType, setItemType] = useState<"parts" | "labor" | "subcontract">("parts")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: any = {
      itemType,
      description: formData.get("description"),
    }

    if (itemType === "parts") {
      data.partNumber = formData.get("partNumber") || null
      data.quantity = parseFloat(formData.get("quantity") as string) || 1
      data.unitPrice = parseFloat(formData.get("unitPrice") as string) || 0
    } else if (itemType === "labor") {
      data.hours = parseFloat(formData.get("hours") as string) || 0
      data.rate = parseFloat(formData.get("rate") as string) || shopLaborRate
      data.quantity = 1
      data.unitPrice = data.hours * data.rate
    } else {
      data.quantity = 1
      data.unitPrice = parseFloat(formData.get("amount") as string) || 0
    }

    data.notes = formData.get("notes") || null

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add item")
      }
      toast.success("Line item added")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-sm btn-secondary">
        <Plus className="w-4 h-4 mr-1" />
        Add Item
      </button>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Add Line Item</h4>
        <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setItemType("parts")}
          className={`btn btn-sm ${itemType === "parts" ? "btn-primary" : "btn-secondary"}`}
        >
          <Package className="w-3.5 h-3.5 mr-1" />
          Part
        </button>
        <button
          type="button"
          onClick={() => setItemType("labor")}
          className={`btn btn-sm ${itemType === "labor" ? "btn-primary" : "btn-secondary"}`}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          Labor
        </button>
        <button
          type="button"
          onClick={() => setItemType("subcontract")}
          className={`btn btn-sm ${itemType === "subcontract" ? "btn-primary" : "btn-secondary"}`}
        >
          <Wrench className="w-3.5 h-3.5 mr-1" />
          Subcontract
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <input
            type="text"
            name="description"
            required
            placeholder={
              itemType === "parts" ? "e.g., Oil Filter - Spin-on" :
              itemType === "labor" ? "e.g., Engine inspection" :
              "e.g., Prop overhaul by ABC Prop Shop"
            }
            className="input w-full"
          />
        </div>

        {itemType === "parts" && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Part #</label>
              <input type="text" name="partNumber" placeholder="P/N" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
              <input type="number" name="quantity" defaultValue="1" min="0.01" step="0.01" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <input type="number" name="unitPrice" step="0.01" min="0" placeholder="0.00" className="input w-full" />
            </div>
          </div>
        )}

        {itemType === "labor" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input type="number" name="hours" step="0.1" min="0" required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($/hr)</label>
              <input type="number" name="rate" step="0.01" min="0" defaultValue={shopLaborRate} className="input w-full" />
            </div>
          </div>
        )}

        {itemType === "subcontract" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input type="number" name="amount" step="0.01" min="0" required className="input w-full" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input type="text" name="notes" placeholder="Optional notes" className="input w-full" />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-sm btn-primary">
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  )
}
