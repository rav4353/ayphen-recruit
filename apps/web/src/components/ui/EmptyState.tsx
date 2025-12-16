import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <Icon className="text-neutral-400 dark:text-neutral-600" size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
