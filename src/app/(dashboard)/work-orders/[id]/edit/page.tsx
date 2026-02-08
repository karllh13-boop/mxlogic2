"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, ClipboardList, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface Customer {
  id: string
  name: string
}

export default function EditWorkOrderPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [woNumber, setWoNumber] = useState("")
  const [aircraftNNumber, setAircraftNNumber] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workType: "",
    priority: "0",
    customerId: "",
    scheduledStart: "",
    scheduledEnd: "",
    hobbsIn: "",
    tachIn: "",
    hobbsOut: "",
    tachOut: "",
    estimatedLabor: "",
    estimatedParts: "",
    assignedMechanic: "",
    inspector: "",
    notes: "",
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/work-orders/${params.id}`).then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
    ]).then(([wo, customerData]) => {
      setWoNumber(wo.woNumber)
      setAircraftNNumber(wo.aircraft?.nNumber || "")
      setFormData({
        title: wo.title || "",
        description: wo.description || "",
        workType: wo.workType || "",
        priority: wo.priority?.toString() || "0",
        customerId: wo.customerId || "",
        scheduledStart: wo.scheduledStart ? wo.scheduledStart.split("T")[0] : "",
        scheduledEnd: wo.scheduledEnd ? wo.scheduledEnd.split("T")[0] : "",
        hobbsIn: wo.hobbsIn?.toString() || "",
        tachIn: wo.tachIn?.toString() || "",
        hobbsOut: wo.hobbsOut?.toString() || "",
        tachOut: wo.tachOut?.toString() || "",
        estimatedLabor: wo.estimatedLabor?.toString() || "",
        estimatedParts: wo.estimatedParts?.toString() || "",
        assignedMechanic: wo.assignedMechanic || "",
        inspector: wo.inspector || "",
        notes: wo.notes || "",
      })
      setCustomers(customerData)
      setLoading(false)
    }).catch(() => {
      setError("Failed to load work order")
      setLoading(false)
    })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/work-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          workType: formData.workType || null,
          priority: parseInt(formData.priority),
          customerId: formData.customerId || null,
          scheduledStart: formData.scheduledStart || null,
          scheduledEnd: formData.scheduledEnd || null,
          hobbsIn: formData.hobbsIn ? parseFloat(formData.hobbsIn) : null,
          tachIn: formData.tachIn ? parseFloat(formData.tachIn) : null,
          hobbsOut: formData.hobbsOut ? parseFloat(formData.hobbsOut) : null,
          tachOut: formData.tachOut ? parseFloat(formData.tachOut) : null,
          estimatedLabor: formData.estimatedLabor ? parseFloat(formData.estimatedLabor) : null,
          estimatedParts: formData.estimatedParts ? parseFloat(formData.estimatedParts) : null,
          assignedMechanic: formData.assignedMechanic || null,
          inspector: formData.inspector || null,
          notes: formData.notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update")
      }
      toast.success("Work order updated successfully")
      router.push(`/work-orders/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to update work order")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/work-orders/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Work order cancelled")
      router.push("/work-orders")
    } catch {
      toast.error("Failed to cancel work order")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  function u(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="animate-pulse space-y-6"><div className="h-10 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /><div className="h-48 bg-gray-200 rounded" /></div></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/work-orders/${params.id}`} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <ClipboardList className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Work Order</h1>
            <p className="text-gray-500">{woNumber} — {aircraftNNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteDialog(true)} className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300">
          <Trash2 className="w-4 h-4 mr-2" />Cancel WO
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={formData.title} onChange={e => u("title", e.target.value)} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
              <select value={formData.workType} onChange={e => u("workType", e.target.value)} className="input w-full">
                <option value="">Select...</option>
                <option value="annual">Annual Inspection</option>
                <option value="100hr">100 Hour Inspection</option>
                <option value="unscheduled">Unscheduled</option>
                <option value="squawk">Squawk Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={formData.priority} onChange={e => u("priority", e.target.value)} className="input w-full">
                <option value="0">Normal</option>
                <option value="1">High</option>
                <option value="2">AOG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select value={formData.customerId} onChange={e => u("customerId", e.target.value)} className="input w-full">
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mechanic</label>
              <input type="text" value={formData.assignedMechanic} onChange={e => u("assignedMechanic", e.target.value)} className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <textarea value={formData.description} onChange={e => u("description", e.target.value)} rows={4} className="input w-full" />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label><input type="date" value={formData.scheduledStart} onChange={e => u("scheduledStart", e.target.value)} className="input w-full" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Scheduled End</label><input type="date" value={formData.scheduledEnd} onChange={e => u("scheduledEnd", e.target.value)} className="input w-full" /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Times</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hobbs In</label><input type="number" value={formData.hobbsIn} onChange={e => u("hobbsIn", e.target.value)} step="0.1" className="input w-full" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tach In</label><input type="number" value={formData.tachIn} onChange={e => u("tachIn", e.target.value)} step="0.1" className="input w-full" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hobbs Out</label><input type="number" value={formData.hobbsOut} onChange={e => u("hobbsOut", e.target.value)} step="0.1" className="input w-full" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tach Out</label><input type="number" value={formData.tachOut} onChange={e => u("tachOut", e.target.value)} step="0.1" className="input w-full" /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estimated Labor ($)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" value={formData.estimatedLabor} onChange={e => u("estimatedLabor", e.target.value)} step="0.01" className="input w-full pl-7" /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Estimated Parts ($)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" value={formData.estimatedParts} onChange={e => u("estimatedParts", e.target.value)} step="0.01" className="input w-full pl-7" /></div></div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea value={formData.notes} onChange={e => u("notes", e.target.value)} rows={3} className="input w-full" />
        </div>

        <div className="flex justify-end gap-4">
          <Link href={`/work-orders/${params.id}`} className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Cancel Work Order"
        message={`Are you sure you want to cancel ${woNumber}? The work order will be marked as cancelled.`}
        confirmText="Cancel WO"
        loading={deleting}
      />
    </div>
  )
}
