'use client';

import { useEffect, useState } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categories = Object.keys(groupedShortcuts);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Keyboard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-neutral-500">
                Power user productivity shortcuts
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {groupedShortcuts[category].map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {shortcut.description}
                      </span>
                      <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <Command className="h-4 w-4" />
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 rounded border text-xs">?</kbd> to toggle this panel
            </span>
            <span>
              Use <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 rounded border text-xs">Esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that listens for global event
export function GlobalKeyboardShortcutsModal({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('open-shortcuts-modal', handleOpen);
    window.addEventListener('close-modal', handleClose);

    return () => {
      window.removeEventListener('open-shortcuts-modal', handleOpen);
      window.removeEventListener('close-modal', handleClose);
    };
  }, []);

  return (
    <KeyboardShortcutsModal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      shortcuts={shortcuts}
    />
  );
}
