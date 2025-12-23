import { useState } from 'react';
import { Download, CheckSquare, Square } from 'lucide-react';
import { Button, Modal } from '../ui';

export interface ExportColumn {
    key: string;
    label: string;
    defaultSelected?: boolean;
}

interface ColumnSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    columns: ExportColumn[];
    onExport: (selectedColumns: string[]) => void | Promise<void>;
    title?: string;
    description?: string;
    exportButtonText?: string;
}

export function ColumnSelector({
    isOpen,
    onClose,
    columns,
    onExport,
    title = 'Select Columns to Export',
    description = 'Choose which columns you want to include in your CSV download',
    exportButtonText = 'Download CSV',
}: ColumnSelectorProps) {
    // Initialize with default selections or all columns
    const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
        columns
            .filter((col) => col.defaultSelected !== false)
            .map((col) => col.key)
    );
    const [isExporting, setIsExporting] = useState(false);

    const toggleColumn = (key: string) => {
        setSelectedColumns((prev) =>
            prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key]
        );
    };

    const selectAll = () => {
        setSelectedColumns(columns.map((col) => col.key));
    };

    const deselectAll = () => {
        setSelectedColumns([]);
    };

    const handleExport = async () => {
        if (selectedColumns.length === 0) {
            return;
        }
        setIsExporting(true);
        try {
            await onExport(selectedColumns);
            onClose();
        } finally {
            setIsExporting(false);
        }
    };

    // Reset selections when modal closes
    const handleClose = () => {
        setSelectedColumns(
            columns
                .filter((col) => col.defaultSelected !== false)
                .map((col) => col.key)
        );
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {description}
                </p>

                {/* Quick actions */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedColumns.length} of {columns.length} selected
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                            Select All
                        </button>
                        <span className="text-neutral-300 dark:text-neutral-600">|</span>
                        <button
                            type="button"
                            onClick={deselectAll}
                            className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Column list */}
                <div className="max-h-96 overflow-y-auto space-y-1">
                    {columns.map((column) => {
                        const isSelected = selectedColumns.includes(column.key);
                        return (
                            <button
                                key={column.key}
                                type="button"
                                onClick={() => toggleColumn(column.key)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                            >
                                {isSelected ? (
                                    <CheckSquare size={18} className="text-primary-600 dark:text-primary-400 shrink-0" />
                                ) : (
                                    <Square size={18} className="text-neutral-400 shrink-0" />
                                )}
                                <span className={`text-sm font-medium ${isSelected
                                    ? 'text-neutral-900 dark:text-white'
                                    : 'text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                    {column.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <Button variant="secondary" onClick={handleClose} disabled={isExporting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={selectedColumns.length === 0 || isExporting}
                        isLoading={isExporting}
                        className="gap-2"
                    >
                        <Download size={16} />
                        {exportButtonText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
