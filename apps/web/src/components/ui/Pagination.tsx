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
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <div className="text-sm text-white/60">
        Showing <span className="font-medium text-white">{startItem}</span> to{' '}
        <span className="font-medium text-white">{endItem}</span> of{' '}
        <span className="font-medium text-white">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            hasPrevPage
              ? 'text-white/70 hover:text-white hover:bg-white/5'
              : 'text-white/30 cursor-not-allowed'
          )}
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
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  pageNum === page
                    ? 'bg-primary-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
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
            'p-2 rounded-lg transition-colors',
            hasNextPage
              ? 'text-white/70 hover:text-white hover:bg-white/5'
              : 'text-white/30 cursor-not-allowed'
          )}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
