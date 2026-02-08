"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, ClipboardList } from "lucide-react"

interface Aircraft {
  id: string
  nNumber: string
  manufacturer: string | null
  model: string | null
  customerId: string | null
}

interface Customer {
  id: string
  name: string
}

export default function NewWorkOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedAircraft = searchParams.get("aircraft")
  const preselectedCustomer = searchParams.get("customer")
  const squawkId = searchParams.get("squawk")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedAircraft, setSelectedAircraft] = useState<string>(preselectedAircraft || "")

  useEffect(() => {
    Promise.all([
      fetch("/api/aircraft").then(res => res.json()),
      fetch("/api/customers").then(res => res.json()),
    ]).then(([aircraftData, customerData]) => {
      setAircraft(aircraftData)
      setCustomers(customerData)
    }).catch(console.error)
  }, [])

  // Auto-select customer when aircraft changes
  useEffect(() => {
    if (selectedAircraft) {
      const ac = aircraft.find(a => a.id === selectedAircraft)
      if (ac?.customerId) {
        const customerSelect = document.querySelector('select[name="customerId"]') as HTMLSelectElement
        if (customerSelect) {
          customerSelect.value = ac.customerId
        }
      }
    }
  }, [selectedAircraft, aircraft])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      aircraftId: formData.get("aircraftId"),
      customerId: formData.get("customerId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      workType: formData.get("workType") || null,
      priority: parseInt(formData.get("priority") as string) || 0,
      scheduledStart: formData.get("scheduledStart") || null,
      scheduledEnd: formData.get("scheduledEnd") || null,
      hobbsIn: formData.get("hobbsIn") 
        ? parseFloat(formData.get("hobbsIn") as string) 
        : null,
      tachIn: formData.get("tachIn") 
        ? parseFloat(formData.get("tachIn") as string) 
        : null,
      estimatedLabor: formData.get("estimatedLabor") 
        ? parseFloat(formData.get("estimatedLabor") as string) 
        : null,
      estimatedParts: formData.get("estimatedParts") 
        ? parseFloat(formData.get("estimatedParts") as string) 
        : null,
      notes: formData.get("notes") || null,
      squawkId: squawkId || null,
    }

    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create work order")
      }

      const workOrder = await res.json()
      router.push(`/work-orders/${workOrder.id}`)
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
        <Link href="/work-orders" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
          <ClipboardList className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Work Order</h1>
          <p className="text-gray-500">Create a new work order</p>
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
                Aircraft *
              </label>
              <select 
                name="aircraftId" 
                required 
                value={selectedAircraft}
                onChange={(e) => setSelectedAircraft(e.target.value)}
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
                Customer
              </label>
              <select 
                name="customerId" 
                defaultValue={preselectedCustomer || ""}
                className="input w-full"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g., Annual Inspection, 100 Hour, Oil Change"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Type
              </label>
              <select name="workType" className="input w-full">
                <option value="">Select...</option>
                <option value="annual">Annual Inspection</option>
                <option value="100hr">100 Hour Inspection</option>
                <option value="unscheduled">Unscheduled Maintenance</option>
                <option value="squawk">Squawk Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select name="priority" defaultValue="0" className="input w-full">
                <option value="0">Normal</option>
                <option value="1">High</option>
                <option value="2">AOG (Aircraft on Ground)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <textarea
            name="description"
            rows={4}
            placeholder="Describe the work to be performed..."
            className="input w-full"
          />
        </div>

        {/* Schedule */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Start
              </label>
              <input
                type="date"
                name="scheduledStart"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled End
              </label>
              <input
                type="date"
                name="scheduledEnd"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Aircraft Times */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Times (In)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hobbs
              </label>
              <input
                type="number"
                name="hobbsIn"
                step="0.1"
                min="0"
                placeholder="0.0"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tach
              </label>
              <input
                type="number"
                name="tachIn"
                step="0.1"
                min="0"
                placeholder="0.0"
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
                Estimated Labor ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="estimatedLabor"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input w-full pl-7"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Parts ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="estimatedParts"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input w-full pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any internal notes for this work order..."
            className="input w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/work-orders" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Work Order"}
          </button>
        </div>
      </form>
    </div>
  )
}
