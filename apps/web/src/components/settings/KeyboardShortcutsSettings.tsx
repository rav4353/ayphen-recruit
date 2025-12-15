'use client';

import { useState } from 'react';
import {
  Keyboard,
  Monitor,
  Search,
  Navigation,
  MousePointer,
  HelpCircle,
  Command,
  Lightbulb,
} from 'lucide-react';

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

interface Shortcut {
  keys: { mac: string[]; windows: string[] };
  description: string;
  category: string;
}

const ALL_SHORTCUTS: Shortcut[] = [
  { keys: { mac: ['⌥', 'G'], windows: ['Alt', 'G'] }, description: 'Go to Dashboard', category: 'Navigation' },
  { keys: { mac: ['⌥', 'J'], windows: ['Alt', 'J'] }, description: 'Go to Jobs', category: 'Navigation' },
  { keys: { mac: ['⌥', 'C'], windows: ['Alt', 'C'] }, description: 'Go to Candidates', category: 'Navigation' },
  { keys: { mac: ['⌥', 'P'], windows: ['Alt', 'P'] }, description: 'Go to Pipeline', category: 'Navigation' },
  { keys: { mac: ['⌥', 'I'], windows: ['Alt', 'I'] }, description: 'Go to Interviews', category: 'Navigation' },
  { keys: { mac: ['⌥', 'R'], windows: ['Alt', 'R'] }, description: 'Go to Reports', category: 'Navigation' },
  { keys: { mac: ['⌥', 'S'], windows: ['Alt', 'S'] }, description: 'Go to Settings', category: 'Navigation' },
  { keys: { mac: ['⌘', 'K'], windows: ['Ctrl', 'K'] }, description: 'Open Command Palette', category: 'Search' },
  { keys: { mac: ['/'], windows: ['/'] }, description: 'Focus Search', category: 'Search' },
  { keys: { mac: ['⌘', 'F'], windows: ['Ctrl', 'F'] }, description: 'Find in Page', category: 'Search' },
  { keys: { mac: ['⌘', 'N'], windows: ['Ctrl', 'N'] }, description: 'Create New', category: 'Actions' },
  { keys: { mac: ['⌘', 'S'], windows: ['Ctrl', 'S'] }, description: 'Save', category: 'Actions' },
  { keys: { mac: ['⌘', 'Enter'], windows: ['Ctrl', 'Enter'] }, description: 'Submit Form', category: 'Actions' },
  { keys: { mac: ['↑'], windows: ['↑'] }, description: 'Select Previous Item', category: 'List Navigation' },
  { keys: { mac: ['↓'], windows: ['↓'] }, description: 'Select Next Item', category: 'List Navigation' },
  { keys: { mac: ['Enter'], windows: ['Enter'] }, description: 'Open Selected Item', category: 'List Navigation' },
  { keys: { mac: ['E'], windows: ['E'] }, description: 'Email Candidate', category: 'Candidate Actions' },
  { keys: { mac: ['S'], windows: ['S'] }, description: 'Schedule Interview', category: 'Candidate Actions' },
  { keys: { mac: ['M'], windows: ['M'] }, description: 'Move to Stage', category: 'Candidate Actions' },
  { keys: { mac: ['N'], windows: ['N'] }, description: 'Add Note', category: 'Candidate Actions' },
  { keys: { mac: ['?'], windows: ['?'] }, description: 'Show Keyboard Shortcuts', category: 'General' },
  { keys: { mac: ['Esc'], windows: ['Esc'] }, description: 'Close Modal / Cancel', category: 'General' },
  { keys: { mac: ['⌘', 'Z'], windows: ['Ctrl', 'Z'] }, description: 'Undo', category: 'General' },
];

const CATEGORIES = [
  { id: 'Navigation', icon: Navigation, color: 'bg-blue-500' },
  { id: 'Search', icon: Search, color: 'bg-violet-500' },
  { id: 'Actions', icon: MousePointer, color: 'bg-emerald-500' },
  { id: 'List Navigation', icon: Navigation, color: 'bg-amber-500' },
  { id: 'Candidate Actions', icon: MousePointer, color: 'bg-pink-500' },
  { id: 'General', icon: HelpCircle, color: 'bg-neutral-500' },
];

function KeyBadge({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center min-w-[26px] h-7 px-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 shadow-sm">
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-neutral-400 text-xs font-medium">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function KeyboardShortcutsSettings() {
  const [platform, setPlatform] = useState<'mac' | 'windows'>(isMac ? 'mac' : 'windows');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredShortcuts = ALL_SHORTCUTS.filter(shortcut => {
    const matchesSearch = searchQuery === '' || 
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-blue-600" />
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Boost your productivity with keyboard shortcuts
          </p>
        </div>
        
        {/* Platform Toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => setPlatform('mac')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              platform === 'mac'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Command className="h-4 w-4" />
            macOS
          </button>
          <button
            onClick={() => setPlatform('windows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              platform === 'windows'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Monitor className="h-4 w-4" />
            Windows
          </button>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Pro Tip</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-700 rounded text-xs font-mono font-medium">?</kbd> anywhere 
              to show shortcuts. Use <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-700 rounded text-xs font-mono font-medium">{platform === 'mac' ? '⌘' : 'Ctrl'}+K</kbd> for 
              the command palette.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts Grid */}
      {Object.keys(groupedShortcuts).length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No shortcuts found</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">Try a different search term or clear filters</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => {
            const categoryInfo = CATEGORIES.find(c => c.id === category);
            const Icon = categoryInfo?.icon || HelpCircle;
            
            return (
              <div key={category} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                  <div className={`w-8 h-8 rounded-lg ${categoryInfo?.color || 'bg-neutral-500'} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${categoryInfo?.color?.replace('bg-', 'text-') || 'text-neutral-500'}`} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white flex-1">{category}</h3>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                    {shortcuts.length}
                  </span>
                </div>
                
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {shortcut.description}
                      </span>
                      <KeyBadge keys={shortcut.keys[platform]} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
