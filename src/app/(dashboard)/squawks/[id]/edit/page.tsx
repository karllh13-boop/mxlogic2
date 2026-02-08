"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertTriangle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function EditSquawkPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open",
    severity: "minor",
    priority: "0",
    category: "",
    ataChapter: "",
    reportedBy: "",
    assignedTo: "",
    estimatedHours: "",
    estimatedCost: "",
    partsNeeded: "",
    resolutionNotes: "",
  })

  useEffect(() => {
    fetch(`/api/squawks/${params.id}`)
      .then(r => r.json())
      .then(sq => {
        setFormData({
          title: sq.title || "",
          description: sq.description || "",
          status: sq.status || "open",
          severity: sq.severity || "minor",
          priority: sq.priority?.toString() || "0",
          category: sq.category || "",
          ataChapter: sq.ataChapter || "",
          reportedBy: sq.reportedBy || "",
          assignedTo: sq.assignedTo || "",
          estimatedHours: sq.estimatedHours?.toString() || "",
          estimatedCost: sq.estimatedCost?.toString() || "",
          partsNeeded: sq.partsNeeded || "",
          resolutionNotes: sq.resolutionNotes || "",
        })
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load squawk")
        setLoading(false)
      })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/squawks/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          severity: formData.severity,
          priority: parseInt(formData.priority),
          category: formData.category || null,
          ataChapter: formData.ataChapter || null,
          reportedBy: formData.reportedBy || null,
          assignedTo: formData.assignedTo || null,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          partsNeeded: formData.partsNeeded || null,
          resolutionNotes: formData.resolutionNotes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update")
      }
      toast.success("Squawk updated successfully")
      router.push(`/squawks/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to update squawk")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/squawks/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Squawk deleted")
      router.push("/squawks")
    } catch {
      toast.error("Failed to delete squawk")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  function u(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="animate-pulse space-y-6"><div className="h-10 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /></div></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/squawks/${params.id}`} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Squawk</h1>
            <p className="text-gray-500">{formData.title}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteDialog(true)} className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300">
          <Trash2 className="w-4 h-4 mr-2" />Delete
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={formData.title} onChange={e => u("title", e.target.value)} required className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={e => u("description", e.target.value)} rows={4} className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Severity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => u("status", e.target.value)} className="input w-full">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={formData.severity} onChange={e => u("severity", e.target.value)} className="input w-full">
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={formData.priority} onChange={e => u("priority", e.target.value)} className="input w-full">
                <option value="0">Normal</option>
                <option value="1">High</option>
                <option value="2">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category} onChange={e => u("category", e.target.value)} className="input w-full">
                <option value="">Select...</option>
                <option value="Airframe">Airframe</option>
                <option value="Engine">Engine</option>
                <option value="Propeller">Propeller</option>
                <option value="Avionics">Avionics</option>
                <option value="Electrical">Electrical</option>
                <option value="Landing Gear">Landing Gear</option>
                <option value="Flight Controls">Flight Controls</option>
                <option value="Instruments">Instruments</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ATA Chapter</label>
              <input type="text" value={formData.ataChapter} onChange={e => u("ataChapter", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
              <input type="text" value={formData.reportedBy} onChange={e => u("reportedBy", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input type="text" value={formData.assignedTo} onChange={e => u("assignedTo", e.target.value)} className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input type="number" value={formData.estimatedHours} onChange={e => u("estimatedHours", e.target.value)} step="0.1" min="0" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" value={formData.estimatedCost} onChange={e => u("estimatedCost", e.target.value)} step="0.01" min="0" className="input w-full pl-7" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parts Needed</label>
              <textarea value={formData.partsNeeded} onChange={e => u("partsNeeded", e.target.value)} rows={2} className="input w-full" />
            </div>
          </div>
        </div>

        {formData.status === "resolved" && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
              <textarea value={formData.resolutionNotes} onChange={e => u("resolutionNotes", e.target.value)} rows={3} className="input w-full" />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href={`/squawks/${params.id}`} className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Squawk"
        message="Are you sure you want to permanently delete this squawk? This action cannot be undone."
        loading={deleting}
      />
    </div>
  )
}
