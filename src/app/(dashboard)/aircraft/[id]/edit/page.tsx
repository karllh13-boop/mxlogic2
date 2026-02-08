"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plane, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface Customer {
  id: string
  name: string
}

export default function EditAircraftPage() {
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    nNumber: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    year: "",
    typeCertificate: "",
    voltage: "",
    baseAirport: "",
    registeredOwner: "",
    registeredAddress: "",
    customerId: "",
    notes: "",
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/aircraft/${params.id}`).then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
    ]).then(([aircraft, customerData]) => {
      setFormData({
        nNumber: aircraft.nNumber || "",
        serialNumber: aircraft.serialNumber || "",
        manufacturer: aircraft.manufacturer || "",
        model: aircraft.model || "",
        year: aircraft.year?.toString() || "",
        typeCertificate: aircraft.typeCertificate || "",
        voltage: aircraft.voltage || "",
        baseAirport: aircraft.baseAirport || "",
        registeredOwner: aircraft.registeredOwner || "",
        registeredAddress: aircraft.registeredAddress || "",
        customerId: aircraft.customerId || "",
        notes: aircraft.notes || "",
      })
      setCustomers(customerData)
      setLoading(false)
    }).catch(() => {
      setError("Failed to load aircraft")
      setLoading(false)
    })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/aircraft/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
          serialNumber: formData.serialNumber || null,
          manufacturer: formData.manufacturer || null,
          model: formData.model || null,
          typeCertificate: formData.typeCertificate || null,
          voltage: formData.voltage || null,
          baseAirport: formData.baseAirport || null,
          registeredOwner: formData.registeredOwner || null,
          registeredAddress: formData.registeredAddress || null,
          customerId: formData.customerId || null,
          notes: formData.notes || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update aircraft")
      }

      toast.success("Aircraft updated successfully")
      router.push(`/aircraft/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to update aircraft")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/aircraft/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Aircraft deactivated")
      router.push("/aircraft")
    } catch {
      toast.error("Failed to delete aircraft")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  function updateField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/aircraft/${params.id}`} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <Plane className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Aircraft</h1>
            <p className="text-gray-500">{formData.nNumber}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N-Number *</label>
              <input type="text" value={formData.nNumber} onChange={e => updateField("nNumber", e.target.value)} required className="input w-full uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input type="text" value={formData.serialNumber} onChange={e => updateField("serialNumber", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input type="text" value={formData.manufacturer} onChange={e => updateField("manufacturer", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" value={formData.model} onChange={e => updateField("model", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" value={formData.year} onChange={e => updateField("year", e.target.value)} min="1900" max="2100" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type Certificate</label>
              <input type="text" value={formData.typeCertificate} onChange={e => updateField("typeCertificate", e.target.value)} className="input w-full" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voltage System</label>
              <select value={formData.voltage} onChange={e => updateField("voltage", e.target.value)} className="input w-full">
                <option value="">Select...</option>
                <option value="12v">12V</option>
                <option value="14v">14V</option>
                <option value="24v">24V</option>
                <option value="28v">28V</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Airport</label>
              <input type="text" value={formData.baseAirport} onChange={e => updateField("baseAirport", e.target.value)} className="input w-full uppercase" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Owner</label>
              <input type="text" value={formData.registeredOwner} onChange={e => updateField("registeredOwner", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
              <textarea value={formData.registeredAddress} onChange={e => updateField("registeredAddress", e.target.value)} rows={2} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select value={formData.customerId} onChange={e => updateField("customerId", e.target.value)} className="input w-full">
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea value={formData.notes} onChange={e => updateField("notes", e.target.value)} rows={4} className="input w-full" />
        </div>

        <div className="flex justify-end gap-4">
          <Link href={`/aircraft/${params.id}`} className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Aircraft"
        message={`Are you sure you want to deactivate ${formData.nNumber}? This aircraft will be hidden from lists but data will be preserved.`}
        confirmText="Deactivate"
        loading={deleting}
      />
    </div>
  )
}
