"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plane } from "lucide-react"

export default function NewAircraftPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customer")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      nNumber: formData.get("nNumber"),
      serialNumber: formData.get("serialNumber") || null,
      manufacturer: formData.get("manufacturer") || null,
      model: formData.get("model") || null,
      year: formData.get("year") ? parseInt(formData.get("year") as string) : null,
      typeCertificate: formData.get("typeCertificate") || null,
      voltage: formData.get("voltage") || null,
      registeredOwner: formData.get("registeredOwner") || null,
      registeredAddress: formData.get("registeredAddress") || null,
      baseAirport: formData.get("baseAirport") || null,
      customerId: formData.get("customerId") || null,
      notes: formData.get("notes") || null,
    }

    try {
      const res = await fetch("/api/aircraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create aircraft")
      }

      const aircraft = await res.json()
      router.push(`/aircraft/${aircraft.id}`)
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
        <Link href="/aircraft" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <Plane className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Aircraft</h1>
          <p className="text-gray-500">Register a new aircraft in your shop</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N-Number *
              </label>
              <input
                type="text"
                name="nNumber"
                required
                placeholder="N12345"
                className="input w-full uppercase"
                pattern="[Nn][0-9A-Za-z]+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                placeholder="123-456"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                placeholder="Cessna"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                placeholder="172S"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                placeholder="2020"
                min="1900"
                max="2100"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Certificate
              </label>
              <input
                type="text"
                name="typeCertificate"
                placeholder="A00009CE"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voltage System
              </label>
              <select name="voltage" className="input w-full">
                <option value="">Select...</option>
                <option value="12v">12V</option>
                <option value="14v">14V</option>
                <option value="24v">24V</option>
                <option value="28v">28V</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Airport
              </label>
              <input
                type="text"
                name="baseAirport"
                placeholder="KDXR"
                className="input w-full uppercase"
              />
            </div>
          </div>
        </div>

        {/* Ownership */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Owner
              </label>
              <input
                type="text"
                name="registeredOwner"
                placeholder="John Smith"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Address
              </label>
              <textarea
                name="registeredAddress"
                rows={2}
                placeholder="123 Main St, City, State 12345"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select name="customerId" defaultValue={customerId || ""} className="input w-full">
                <option value="">Select customer...</option>
                {/* TODO: Load customers dynamically */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Link this aircraft to an existing customer
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            name="notes"
            rows={4}
            placeholder="Any additional notes about this aircraft..."
            className="input w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/aircraft" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Aircraft"}
          </button>
        </div>
      </form>
    </div>
  )
}
