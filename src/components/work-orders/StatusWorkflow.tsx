"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Play, CheckCircle, Pause, FileText, XCircle, 
  ArrowRight, RotateCcw 
} from "lucide-react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  open: { label: "Open", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  pending_parts: { label: "Pending Parts", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  invoiced: { label: "Invoiced", color: "bg-green-200 text-green-900" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
}

const transitions: Record<string, Array<{ status: string; label: string; icon: any; variant: string }>> = {
  draft: [
    { status: "open", label: "Open Work Order", icon: Play, variant: "btn-primary" },
  ],
  open: [
    { status: "in_progress", label: "Start Work", icon: Play, variant: "btn-primary" },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "btn-outline text-red-600" },
  ],
  in_progress: [
    { status: "completed", label: "Complete", icon: CheckCircle, variant: "btn-success" },
    { status: "pending_parts", label: "Pending Parts", icon: Pause, variant: "btn-outline" },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "btn-outline text-red-600" },
  ],
  pending_parts: [
    { status: "in_progress", label: "Resume Work", icon: Play, variant: "btn-primary" },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "btn-outline text-red-600" },
  ],
  completed: [
    { status: "invoiced", label: "Mark Invoiced", icon: FileText, variant: "btn-success" },
    { status: "in_progress", label: "Reopen", icon: RotateCcw, variant: "btn-outline" },
  ],
  cancelled: [
    { status: "open", label: "Reopen", icon: RotateCcw, variant: "btn-primary" },
  ],
}

interface StatusWorkflowProps {
  workOrderId: string
  currentStatus: string
}

export function StatusWorkflow({ workOrderId, currentStatus }: StatusWorkflowProps) {
  const router = useRouter()
  const toast = useToast()
  const [updating, setUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null)

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update status")
      }
      toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setUpdating(false)
      setConfirmAction(null)
    }
  }

  const availableTransitions = transitions[currentStatus] || []

  if (availableTransitions.length === 0) {
    return null
  }

  // Status progress bar
  const allStatuses = ["draft", "open", "in_progress", "completed", "invoiced"]
  const currentIndex = allStatuses.indexOf(currentStatus)

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {allStatuses.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-2 rounded-full flex-1 ${
              i <= currentIndex && currentStatus !== "cancelled"
                ? "bg-primary-500" 
                : "bg-gray-200"
            }`} />
            {i < allStatuses.length - 1 && <div className="w-1" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        {allStatuses.map(s => (
          <span key={s} className={currentStatus === s ? "font-semibold text-primary-600" : ""}>
            {statusConfig[s]?.label}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map(({ status, label, icon: Icon, variant }) => {
          const needsConfirm = ["cancelled", "completed", "invoiced"].includes(status)
          return (
            <button
              key={status}
              onClick={() => {
                if (needsConfirm) {
                  setConfirmAction({ status, label })
                } else {
                  updateStatus(status)
                }
              }}
              disabled={updating}
              className={`btn btn-sm ${variant}`}
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </button>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && updateStatus(confirmAction.status)}
        title={`${confirmAction?.label}?`}
        message={`Are you sure you want to change the status to "${confirmAction?.label}"? ${
          confirmAction?.status === "cancelled" ? "This will cancel the work order." : ""
        }`}
        confirmText={confirmAction?.label || "Confirm"}
        variant={confirmAction?.status === "cancelled" ? "danger" : "warning"}
        loading={updating}
      />
    </div>
  )
}
