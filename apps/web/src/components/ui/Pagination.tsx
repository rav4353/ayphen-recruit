import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '../../lib/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasNextPage, hasPrevPage, total, limit } = meta;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        Showing <span className="font-medium text-neutral-900 dark:text-white">{startItem}</span> to{' '}
        <span className="font-medium text-neutral-900 dark:text-white">{endItem}</span> of{' '}
        <span className="font-medium text-neutral-900 dark:text-white">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className={clsx(
            'p-2 rounded-lg transition-all duration-150',
            hasPrevPage
              ? 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150',
                  pageNum === page
                    ? 'bg-primary-600 text-white shadow-soft'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === page ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={clsx(
            'p-2 rounded-lg transition-all duration-150',
            hasNextPage
              ? 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
