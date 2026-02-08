"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Clock } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface WorkOrder {
  id: string
  woNumber: string
  title: string
  aircraft: { nNumber: string }
}

export default function NewTimesheetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedWO = searchParams.get("workOrder")
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [calculatedHours, setCalculatedHours] = useState("")

  useEffect(() => {
    fetch("/api/work-orders")
      .then(r => r.json())
      .then(data => {
        // Filter to active work orders only
        const active = data.filter((wo: any) => 
          ["open", "in_progress", "pending_parts"].includes(wo.status)
        )
        setWorkOrders(active)
      })
      .catch(console.error)
  }, [])

  function calculateHours(start: string, end: string) {
    if (!start || !end) return
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    const diff = (eh * 60 + em - sh * 60 - sm) / 60
    if (diff > 0) {
      setCalculatedHours(diff.toFixed(1))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      workOrderId: formData.get("workOrderId") || null,
      description: formData.get("description") || null,
      taskType: formData.get("taskType") || null,
      workDate: formData.get("workDate"),
      startTime: formData.get("startTime") || null,
      endTime: formData.get("endTime") || null,
      hours: formData.get("hours"),
      isBillable: formData.get("isBillable") === "on",
      rate: formData.get("rate") ? parseFloat(formData.get("rate") as string) : null,
      notes: formData.get("notes") || null,
    }

    if (!data.hours || parseFloat(data.hours as string) <= 0) {
      setError("Hours must be greater than 0")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to log time")
      }
      toast.success("Time logged successfully")
      router.push("/timesheets")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to log time")
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link href="/timesheets" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
          <Clock className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Time</h1>
          <p className="text-gray-500">Record hours worked</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Date *</label>
              <input type="date" name="workDate" required defaultValue={today} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Order</label>
              <select name="workOrderId" defaultValue={preselectedWO || ""} className="input w-full">
                <option value="">General / Shop Time</option>
                {workOrders.map(wo => (
                  <option key={wo.id} value={wo.id}>
                    {wo.woNumber} — {wo.aircraft.nNumber} — {wo.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                className="input w-full"
                onChange={(e) => {
                  const end = (document.querySelector('input[name="endTime"]') as HTMLInputElement)?.value
                  calculateHours(e.target.value, end)
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                className="input w-full"
                onChange={(e) => {
                  const start = (document.querySelector('input[name="startTime"]') as HTMLInputElement)?.value
                  calculateHours(start, e.target.value)
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
              <input
                type="number"
                name="hours"
                required
                step="0.1"
                min="0.1"
                max="24"
                value={calculatedHours}
                onChange={(e) => setCalculatedHours(e.target.value)}
                placeholder="0.0"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated from start/end times, or enter manually</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select name="taskType" className="input w-full">
                <option value="">Select...</option>
                <option value="inspection">Inspection</option>
                <option value="repair">Repair</option>
                <option value="install">Install / Remove</option>
                <option value="troubleshoot">Troubleshooting</option>
                <option value="paperwork">Paperwork / Admin</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} placeholder="What did you work on?" className="input w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" name="rate" step="0.01" min="0" placeholder="85.00" className="input w-full pl-7" /></div>
                <p className="text-xs text-gray-500 mt-1">Leave blank to use shop rate</p>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="isBillable" defaultChecked className="rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700">Billable to customer</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea name="notes" rows={2} placeholder="Any additional notes..." className="input w-full" />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/timesheets" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />{loading ? "Logging..." : "Log Time"}
          </button>
        </div>
      </form>
    </div>
  )
}
