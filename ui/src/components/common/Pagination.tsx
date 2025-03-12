"use client";

import { Pagination as PaginationType } from "@/client";
import { BackIcon, NextIcon } from "./Icon";

interface PaginationProps {
  pagination: PaginationType;
  total: number;
  onPaginationChange: (pagination: PaginationType) => void;
}

export function Pagination({
  pagination,
  total,
  onPaginationChange,
}: PaginationProps) {
  const { page, perPage } = pagination;
  total = total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  // Show at most 5 page numbers, including first and last
  const getVisiblePages = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (totalPages <= 5) return pages;

    if (page <= 3) return [...pages.slice(0, 4), "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", ...pages.slice(-4)];

    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const handlePageChange = (newPage: number) => {
    onPaginationChange({
      ...pagination,
      page: newPage,
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm border text-gray-700 hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-gray-700"
      >
        <BackIcon />
      </button>

      {getVisiblePages().map((pageNum, index) =>
        pageNum === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum as number)}
            className={`h-7 w-7 rounded-sm text-xs font-medium transition-colors ${
              page === pageNum
                ? "border border-gray-300 bg-gray-100 text-gray-900"
                : "border border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900"
            } `}
          >
            {pageNum}
          </button>
        ),
      )}

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm border text-gray-700 hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-gray-700"
      >
        <NextIcon />
      </button>
    </div>
  );
}
