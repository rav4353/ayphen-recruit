'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  category: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description' | 'category'>): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  const keyDisplay = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key.replace('Arrow', '').replace('Escape', 'Esc');

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in an input field
    const target = event.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Allow some shortcuts even in input fields
    const allowInInput = event.key === 'Escape' ||
      ((event.ctrlKey || event.metaKey) && ['k', 's', '/'].includes(event.key.toLowerCase()));

    if (isInputField && !allowInInput) return;

    // Debug logging
    console.log('[Shortcuts] Key pressed:', {
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey
    });

    for (const shortcut of shortcutsRef.current) {
      // Use event.code for letter keys to handle Mac Option key properly
      // event.code gives us 'KeyG' for 'g', 'KeyJ' for 'j', etc.
      const codeKey = event.code.replace('Key', '').replace('Digit', '').toLowerCase();
      const eventKey = event.key.toLowerCase();

      // Match against either event.key or the extracted code key
      const keyMatch = eventKey === shortcut.key.toLowerCase() ||
        codeKey === shortcut.key.toLowerCase();

      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        console.log('[Shortcuts] Matched shortcut:', shortcut.description);
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        return;
      }
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    console.log('[Shortcuts] Registering keyboard shortcuts');
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('[Shortcuts] Unregistering keyboard shortcuts');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Global navigation shortcuts hook
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'g',
      alt: true,
      description: 'Go to Dashboard',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/dashboard`),
    },
    {
      key: 'j',
      alt: true,
      description: 'Go to Jobs',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/jobs`),
    },
    {
      key: 'c',
      alt: true,
      description: 'Go to Candidates',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/candidates`),
    },
    {
      key: 'p',
      alt: true,
      description: 'Go to Pipeline',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/pipeline`),
    },
    {
      key: 'i',
      alt: true,
      description: 'Go to Interviews',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/interviews`),
    },
    {
      key: 'r',
      alt: true,
      description: 'Go to Reports',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/reports`),
    },
    {
      key: 's',
      alt: true,
      description: 'Go to Settings',
      category: 'Navigation',
      action: () => navigate(`/${tenantId}/settings`),
    },
    // Search
    {
      key: 'k',
      ctrl: true,
      description: 'Open Command Palette',
      category: 'Search',
      action: () => {
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
    },
    {
      key: '/',
      description: 'Focus Search',
      category: 'Search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    // Actions
    {
      key: 'n',
      ctrl: true,
      description: 'Create New',
      category: 'Actions',
      action: () => {
        const event = new CustomEvent('open-create-menu');
        window.dispatchEvent(event);
      },
    },
    // Help
    {
      key: '?',
      shift: true,
      description: 'Show Keyboard Shortcuts',
      category: 'Help',
      action: () => {
        const event = new CustomEvent('open-shortcuts-modal');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'Escape',
      description: 'Close Modal / Cancel',
      category: 'General',
      action: () => {
        const event = new CustomEvent('close-modal');
        window.dispatchEvent(event);
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Candidate list shortcuts
export function useCandidateListShortcuts(options: {
  onSelect?: (direction: 'up' | 'down') => void;
  onOpen?: () => void;
  onEmail?: () => void;
  onSchedule?: () => void;
  onMove?: () => void;
  onArchive?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      description: 'Select Previous',
      category: 'List',
      action: () => options.onSelect?.('up'),
    },
    {
      key: 'ArrowDown',
      description: 'Select Next',
      category: 'List',
      action: () => options.onSelect?.('down'),
    },
    {
      key: 'Enter',
      description: 'Open Selected',
      category: 'List',
      action: () => options.onOpen?.(),
    },
    {
      key: 'e',
      description: 'Email Candidate',
      category: 'Actions',
      action: () => options.onEmail?.(),
    },
    {
      key: 's',
      description: 'Schedule Interview',
      category: 'Actions',
      action: () => options.onSchedule?.(),
    },
    {
      key: 'm',
      description: 'Move to Stage',
      category: 'Actions',
      action: () => options.onMove?.(),
    },
    {
      key: 'x',
      description: 'Archive',
      category: 'Actions',
      action: () => options.onArchive?.(),
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Job list shortcuts
export function useJobListShortcuts(options: {
  onSelect?: (direction: 'up' | 'down') => void;
  onOpen?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  onClose?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      description: 'Select Previous',
      category: 'List',
      action: () => options.onSelect?.('up'),
    },
    {
      key: 'ArrowDown',
      description: 'Select Next',
      category: 'List',
      action: () => options.onSelect?.('down'),
    },
    {
      key: 'Enter',
      description: 'Open Selected',
      category: 'List',
      action: () => options.onOpen?.(),
    },
    {
      key: 'e',
      description: 'Edit Job',
      category: 'Actions',
      action: () => options.onEdit?.(),
    },
    {
      key: 'd',
      description: 'Duplicate Job',
      category: 'Actions',
      action: () => options.onDuplicate?.(),
    },
    {
      key: 'p',
      description: 'Publish/Unpublish',
      category: 'Actions',
      action: () => options.onPublish?.(),
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
