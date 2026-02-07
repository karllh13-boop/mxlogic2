"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertTriangle } from "lucide-react"

interface Aircraft {
  id: string
  nNumber: string
  manufacturer: string | null
  model: string | null
}

export default function NewSquawkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedAircraft = searchParams.get("aircraft")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aircraft, setAircraft] = useState<Aircraft[]>([])

  useEffect(() => {
    fetch("/api/aircraft")
      .then(res => res.json())
      .then(data => setAircraft(data))
      .catch(console.error)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      aircraftId: formData.get("aircraftId"),
      title: formData.get("title"),
      description: formData.get("description") || null,
      severity: formData.get("severity"),
      priority: parseInt(formData.get("priority") as string) || 0,
      category: formData.get("category") || null,
      ataChapter: formData.get("ataChapter") || null,
      reportedBy: formData.get("reportedBy") || null,
      estimatedHours: formData.get("estimatedHours") 
        ? parseFloat(formData.get("estimatedHours") as string) 
        : null,
      estimatedCost: formData.get("estimatedCost") 
        ? parseFloat(formData.get("estimatedCost") as string) 
        : null,
      partsNeeded: formData.get("partsNeeded") || null,
    }

    try {
      const res = await fetch("/api/squawks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create squawk")
      }

      const squawk = await res.json()
      router.push(`/squawks/${squawk.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link href="/squawks" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Squawk</h1>
          <p className="text-gray-500">Log a new discrepancy or issue</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aircraft & Title */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aircraft *
              </label>
              <select 
                name="aircraftId" 
                required 
                defaultValue={preselectedAircraft || ""}
                className="input w-full"
              >
                <option value="">Select aircraft...</option>
                {aircraft.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.nNumber} - {ac.manufacturer} {ac.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Brief description of the issue"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Detailed description of the squawk..."
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Severity & Priority */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Severity & Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select name="severity" required defaultValue="minor" className="input w-full">
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select name="priority" defaultValue="0" className="input w-full">
                <option value="0">Normal</option>
                <option value="1">High</option>
                <option value="2">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select name="category" className="input w-full">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ATA Chapter
              </label>
              <input
                type="text"
                name="ataChapter"
                placeholder="e.g., 71"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reported By
              </label>
              <input
                type="text"
                name="reportedBy"
                placeholder="Pilot name or source"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Estimates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                step="0.1"
                min="0"
                placeholder="0.0"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="estimatedCost"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input w-full pl-7"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts Needed
              </label>
              <textarea
                name="partsNeeded"
                rows={2}
                placeholder="List any parts that may be needed..."
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/squawks" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Squawk"}
          </button>
        </div>
      </form>
    </div>
  )
}
