'use client';

import { Pagination as PaginationType } from '@/client';

interface PaginationProps {
  pagination: PaginationType;
  total: number;
  onPaginationChange: (pagination: PaginationType) => void;
}

export function Pagination({ pagination, total, onPaginationChange }: PaginationProps) {
  const { page, perPage } = pagination;
  total = total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  // Show at most 5 page numbers, including first and last
  const getVisiblePages = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (totalPages <= 5) return pages;

    if (page <= 3) return [...pages.slice(0, 4), '...', totalPages];
    if (page >= totalPages - 2) return [1, '...', ...pages.slice(-4)];

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const handlePageChange = (newPage: number) => {
    onPaginationChange({
      ...pagination,
      page: newPage
    });
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="h-7 w-7 inline-flex items-center justify-center border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-gray-900 disabled:hover:text-gray-700 hover:border-gray-300"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {getVisiblePages().map((pageNum, index) => (
        pageNum === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum as number)}
            className={`
              h-7 w-7 rounded-sm text-xs font-medium transition-colors
              ${page === pageNum
                ? 'bg-gray-100 text-gray-900 border-gray-300 border'
                : 'text-gray-700 hover:text-gray-900 border border-transparent hover:border-gray-300'
              }
            `}
          >
            {pageNum}
          </button>
        )
      ))}

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="h-7 w-7 inline-flex items-center justify-center border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-gray-900 disabled:hover:text-gray-700 hover:border-gray-300"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
