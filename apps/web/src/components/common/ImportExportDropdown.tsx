import { useState, useRef } from 'react';
import { Download, ChevronDown, FileSpreadsheet, Share } from 'lucide-react';
import { Button } from '../ui';
import { BulkImportModal } from './BulkImportModal';
import { bulkImportApi, extractData } from '../../lib/api';
import toast from 'react-hot-toast';

type EntityType = 'candidates' | 'jobs';

interface ImportExportDropdownProps {
  entityType: EntityType;
  onImportComplete?: () => void;
  onExport?: () => void;
}

export function ImportExportDropdown({ entityType, onImportComplete, onExport }: ImportExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = entityType === 'candidates'
        ? await bulkImportApi.getCandidateTemplate()
        : await bulkImportApi.getJobTemplate();

      const data = extractData(response);

      const blob = new Blob([data.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (err) {
      toast.error('Failed to download template');
    }
    setIsOpen(false);
  };

  const handleExportClick = () => {
    setIsOpen(false);
    onExport?.();
  };

  const handleImportClick = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleImportComplete = () => {
    setIsModalOpen(false);
    onImportComplete?.();
  };

  const entityLabel = entityType === 'candidates' ? 'Candidates' : 'Jobs';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white dark:bg-neutral-800 shadow-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Share size={16} className="rotate-90" />
          <span className="hidden sm:inline">Import/Export</span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <button
                type="button"
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileSpreadsheet size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Import {entityLabel}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload CSV file</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Download Template</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Get sample CSV file</p>
                </div>
              </button>

              {onExport && (
                <>
                  <div className="border-t border-neutral-100 dark:border-neutral-700" />
                  <button
                    type="button"
                    onClick={handleExportClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Share size={16} className="text-purple-600 dark:text-purple-400 rotate-90" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Export {entityLabel}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Download data as CSV</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <BulkImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType={entityType}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
