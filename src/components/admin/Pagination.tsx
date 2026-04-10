"use client";

import Link from "next/link";

interface PaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  total,
  pageSize,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="mt-4 text-sm text-muted">
        Showing {total} result{total !== 1 ? "s" : ""}
      </div>
    );
  }

  function buildUrl(page: number): string {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", page.toString());
    return `${basePath}?${params.toString()}`;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted">
        Showing {start}-{end} of {total}
      </div>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            <span className="material-icons text-[16px]">chevron_left</span>
            Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted/50 cursor-not-allowed">
            <span className="material-icons text-[16px]">chevron_left</span>
            Previous
          </span>
        )}

        <span className="px-3 text-sm">
          Page {currentPage} of {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            Next
            <span className="material-icons text-[16px]">chevron_right</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted/50 cursor-not-allowed">
            Next
            <span className="material-icons text-[16px]">chevron_right</span>
          </span>
        )}
      </div>
    </div>
  );
}
