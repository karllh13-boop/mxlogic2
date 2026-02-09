"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface ApprovalButtonsProps {
  timesheetId: string
  currentStatus: string
}

export function ApprovalButtons({ timesheetId, currentStatus }: ApprovalButtonsProps) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  if (currentStatus !== "pending") return null

  async function updateStatus(newStatus: "approved" | "rejected") {
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(`Timesheet ${newStatus}`)
      router.refresh()
    } catch {
      toast.error("Failed to update timesheet")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-1 mt-2">
      <button
        onClick={() => updateStatus("approved")}
        disabled={loading}
        className="btn btn-xs btn-success"
        title="Approve"
      >
        <CheckCircle className="w-3.5 h-3.5 mr-1" />
        Approve
      </button>
      <button
        onClick={() => updateStatus("rejected")}
        disabled={loading}
        className="btn btn-xs btn-danger"
        title="Reject"
      >
        <XCircle className="w-3.5 h-3.5 mr-1" />
        Reject
      </button>
    </div>
  )
}
