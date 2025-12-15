'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { candidateImportApi } from '@/lib/api';

interface CandidateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CandidateImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CandidateImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    rowCount: number;
    headers: string[];
    errors: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    total: number;
    imported: number;
    skipped: number;
    updated: number;
    errors: { row: number; email: string; error: string }[];
  } | null>(null);

  // Job selection removed for simplicity - can be added via props if needed

  const validateMutation = useMutation({
    mutationFn: (data: string) => candidateImportApi.validate(data),
    onSuccess: (response) => {
      setValidationResult(response.data);
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: { csvData: string; skipDuplicates: boolean; updateExisting: boolean; jobId?: string }) =>
      candidateImportApi.import(data),
    onSuccess: (response) => {
      setImportResult(response.data);
      if (response.data.imported > 0) {
        onSuccess?.();
      }
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        setValidationResult(null);
        setImportResult(null);
        validateMutation.mutate(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await candidateImportApi.getTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidate-import-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Failed to download template');
    }
  };

  const handleImport = () => {
    if (csvData && validationResult?.valid) {
      importMutation.mutate({
        csvData,
        skipDuplicates,
        updateExisting,
      });
    }
  };

  const resetState = () => {
    setCsvData(null);
    setFileName(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Candidates" className="max-w-2xl">
      <div className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-neutral-400" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Download Template</p>
              <p className="text-sm text-neutral-500">
                Get the CSV template with required columns
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>

        {/* File Upload */}
        {!importResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-500/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {fileName ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-primary-500" />
                <p className="font-medium text-neutral-900 dark:text-white">{fileName}</p>
                <p className="text-sm text-neutral-500">Click or drag to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-neutral-400" />
                <p className="font-medium text-neutral-900 dark:text-white">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop CSV file here'}
                </p>
                <p className="text-sm text-neutral-500">or click to browse</p>
              </div>
            )}
          </div>
        )}

        {/* Validation Status */}
        {validateMutation.isPending && (
          <div className="flex items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            <span className="text-neutral-700 dark:text-neutral-300">Validating CSV...</span>
          </div>
        )}

        {validationResult && !importResult && (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                validationResult.valid
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {validationResult.valid
                  ? `Valid CSV with ${validationResult.rowCount} rows`
                  : 'CSV validation failed'}
              </span>
            </div>

            {validationResult.headers.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Detected Columns:</p>
                <div className="flex flex-wrap gap-1">
                  {validationResult.headers.map((h) => (
                    <Badge key={h} variant="secondary">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Issues:</p>
                <ul className="text-sm space-y-1">
                  {validationResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {e}
                    </li>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <li className="text-neutral-500">
                      +{validationResult.errors.length - 5} more issues
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Import Options */}
            {validationResult.valid && (
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Skip Duplicates</p>
                    <p className="text-xs text-neutral-500">Skip rows with existing email addresses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">Update Existing</p>
                    <p className="text-xs text-neutral-500">Update existing candidates with new data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      disabled={skipDuplicates}
                      className="sr-only peer disabled:opacity-50"
                    />
                    <div className={`w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 ${skipDuplicates ? 'opacity-50' : ''}`}></div>
                  </label>
                </div>

                              </div>
            )}
          </div>
        )}

        {/* Import Progress/Result */}
        {importMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              <span className="text-neutral-700 dark:text-neutral-300">Importing candidates...</span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '50%' }}></div>
            </div>
          </div>
        )}

        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{importResult.total}</p>
                <p className="text-xs text-neutral-500">Total Rows</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-xs text-neutral-500">Imported</p>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                <p className="text-xs text-neutral-500">Skipped</p>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-xs text-neutral-500">Updated</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">
                  Errors ({importResult.errors.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResult.errors.map((e, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 bg-red-500/10 rounded flex justify-between"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">Row {e.row}: {e.email || 'No email'}</span>
                      <span className="text-red-600">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="secondary" onClick={handleClose}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && validationResult?.valid && (
            <Button onClick={handleImport} isLoading={importMutation.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              Import {validationResult.rowCount} Candidates
            </Button>
          )}
          {importResult && (
            <Button onClick={resetState}>Import Another File</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
