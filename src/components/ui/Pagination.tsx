import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set("page", page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  // Generate page numbers to show
  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </p>
      <nav className="flex items-center gap-1">
        {currentPage > 1 ? (
          <Link href={buildUrl(currentPage - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className="p-2 text-gray-300"><ChevronLeft className="w-4 h-4" /></span>
        )}

        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                page === currentPage
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {page}
            </Link>
          )
        )}

        {currentPage < totalPages ? (
          <Link href={buildUrl(currentPage + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="p-2 text-gray-300"><ChevronRight className="w-4 h-4" /></span>
        )}
      </nav>
    </div>
  )
}
