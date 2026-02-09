import Link from "next/link"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSort?: string
  currentOrder?: string
  baseUrl: string
  searchParams?: Record<string, string | undefined>
  className?: string
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  baseUrl,
  searchParams = {},
  className = "",
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc"

  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "sort" && key !== "order" && key !== "page") {
      params.set(key, value)
    }
  })
  params.set("sort", sortKey)
  params.set("order", nextOrder)

  return (
    <th className={`py-3 px-4 font-medium text-gray-500 ${className}`}>
      <Link
        href={`${baseUrl}?${params.toString()}`}
        className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        {label}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-primary-600" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
        )}
      </Link>
    </th>
  )
}
