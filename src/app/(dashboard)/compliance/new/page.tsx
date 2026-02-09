"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Shield } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface Aircraft {
  id: string
  nNumber: string
  manufacturer: string | null
  model: string | null
}

export default function NewADCompliancePage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aircraft, setAircraft] = useState<Aircraft[]>([])

  useEffect(() => {
    fetch("/api/aircraft")
      .then((r) => r.json())
      .then(setAircraft)
      .catch(console.error)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      aircraftId: formData.get("aircraftId"),
      adNumber: formData.get("adNumber"),
      adTitle: formData.get("adTitle") || null,
      status: formData.get("status") || "open",
      complianceDate: formData.get("complianceDate") || null,
      complianceHours: formData.get("complianceHours")
        ? parseFloat(formData.get("complianceHours") as string)
        : null,
      methodOfCompliance: formData.get("methodOfCompliance") || null,
      compliedBy: formData.get("compliedBy") || null,
      nextDueDate: formData.get("nextDueDate") || null,
      nextDueHours: formData.get("nextDueHours")
        ? parseFloat(formData.get("nextDueHours") as string)
        : null,
      intervalHours: formData.get("intervalHours")
        ? parseFloat(formData.get("intervalHours") as string)
        : null,
      intervalMonths: formData.get("intervalMonths")
        ? parseInt(formData.get("intervalMonths") as string)
        : null,
      notes: formData.get("notes") || null,
    }

    if (!data.aircraftId || !data.adNumber) {
      setError("Aircraft and AD Number are required")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create AD record")
      }
      toast.success("AD compliance record created")
      router.push("/compliance")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to create AD record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link
          href="/compliance"
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            New AD Compliance Record
          </h1>
          <p className="text-gray-500">Track airworthiness directive compliance</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AD Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aircraft *
              </label>
              <select name="aircraftId" required className="input w-full">
                <option value="">Select aircraft...</option>
                {aircraft.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.nNumber} — {ac.manufacturer} {ac.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AD Number *
              </label>
              <input
                type="text"
                name="adNumber"
                required
                placeholder="e.g., 2024-08-05"
                className="input w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AD Title
              </label>
              <input
                type="text"
                name="adTitle"
                placeholder="Brief description of the AD"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select name="status" defaultValue="open" className="input w-full">
                <option value="open">Open</option>
                <option value="complied">Complied</option>
                <option value="recurring">Recurring</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compliance Date
              </label>
              <input type="date" name="complianceDate" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compliance Hours
              </label>
              <input
                type="number"
                name="complianceHours"
                step="0.1"
                min="0"
                className="input w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method of Compliance
              </label>
              <textarea
                name="methodOfCompliance"
                rows={2}
                placeholder="How was the AD complied with?"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complied By
              </label>
              <input
                type="text"
                name="compliedBy"
                placeholder="Mechanic name and cert #"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recurring (if applicable)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Date
              </label>
              <input type="date" name="nextDueDate" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Hours
              </label>
              <input
                type="number"
                name="nextDueHours"
                step="0.1"
                min="0"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval (Hours)
              </label>
              <input
                type="number"
                name="intervalHours"
                step="0.1"
                min="0"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval (Months)
              </label>
              <input
                type="number"
                name="intervalMonths"
                min="0"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional notes..."
            className="input w-full"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/compliance" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create AD Record"}
          </button>
        </div>
      </form>
    </div>
  )
}
