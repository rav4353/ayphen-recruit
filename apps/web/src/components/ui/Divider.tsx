import { cn } from '../../lib/utils';

export interface DividerProps {
  text?: string;
  className?: string;
}

export function Divider({ text, className }: DividerProps) {
  if (!text) {
    return <div className={cn('border-t border-neutral-200 dark:border-neutral-800', className)} />;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white dark:bg-neutral-900 text-neutral-500">{text}</span>
      </div>
    </div>
  );
}
