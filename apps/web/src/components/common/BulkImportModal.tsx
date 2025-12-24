import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button, Modal } from '../ui';
import { bulkImportApi, extractData } from '../../lib/api';
import toast from 'react-hot-toast';

type EntityType = 'candidates' | 'jobs';
type Step = 'upload' | 'mapping' | 'review' | 'complete';

interface ImportMapping {
  sourceColumn: string;
  targetField: string;
}

interface PreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
  suggestedMappings: ImportMapping[];
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; field: string; message: string }[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  onImportComplete?: () => void;
}

const CANDIDATE_FIELDS = [
  { name: 'firstName', label: 'First Name', required: true },
  { name: 'lastName', label: 'Last Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone', required: false },
  { name: 'currentTitle', label: 'Current Title', required: false },
  { name: 'currentCompany', label: 'Current Company', required: false },
  { name: 'location', label: 'Location', required: false },
  { name: 'linkedInUrl', label: 'LinkedIn URL', required: false },
  { name: 'source', label: 'Source', required: false },
  { name: 'skills', label: 'Skills (comma separated)', required: false },
  { name: 'experience', label: 'Years of Experience', required: false },
  { name: 'education', label: 'Education', required: false },
];

const JOB_FIELDS = [
  { name: 'title', label: 'Job Title', required: true },
  { name: 'description', label: 'Description', required: false },
  { name: 'department', label: 'Department', required: false },
  { name: 'location', label: 'Location', required: false },
  { name: 'employmentType', label: 'Employment Type', required: false },
  { name: 'salaryMin', label: 'Minimum Salary', required: false },
  { name: 'salaryMax', label: 'Maximum Salary', required: false },
  { name: 'requirements', label: 'Requirements', required: false },
  { name: 'benefits', label: 'Benefits', required: false },
];

export function BulkImportModal({
  isOpen,
  onClose,
  entityType,
  onImportComplete,
}: BulkImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(0);

  const fields = entityType === 'candidates' ? CANDIDATE_FIELDS : JOB_FIELDS;
  const entityLabel = entityType === 'candidates' ? 'Candidates' : 'Jobs';

  const previewMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      const response = entityType === 'candidates'
        ? await bulkImportApi.previewCandidates(selectedFile)
        : await bulkImportApi.previewJobs(selectedFile);
      return extractData(response);
    },
    onSuccess: (data: PreviewData) => {
      setPreview(data);
      setMappings(data.suggestedMappings || []);
      setStep('mapping');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to process file');
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const response = entityType === 'candidates'
        ? await bulkImportApi.importCandidates(file, mappings, { skipDuplicates: true })
        : await bulkImportApi.importJobs(file, mappings, { defaultStatus: 'DRAFT' });
      return response.data;
    },
    onSuccess: (data: ImportResult) => {
      setResult(data);
      setStep('complete');
      if (data.successful > 0) {
        toast.success(`Successfully imported ${data.successful} ${entityType}`);
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Import failed');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      previewMutation.mutate(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(droppedFile);
      setError(null);
      previewMutation.mutate(droppedFile);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setMappings([]);
    setResult(null);
    setError(null);
    setReviewPage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleComplete = () => {
    handleReset();
    onImportComplete?.();
    onClose();
  };

  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMappings(prev => {
      const existing = prev.findIndex(m => m.sourceColumn === sourceColumn);
      if (existing >= 0) {
        if (!targetField) return prev.filter((_, i) => i !== existing);
        const updated = [...prev];
        updated[existing] = { sourceColumn, targetField };
        return updated;
      }
      if (targetField) return [...prev, { sourceColumn, targetField }];
      return prev;
    });
  };

  const getMappedField = (sourceColumn: string) =>
    mappings.find(m => m.sourceColumn === sourceColumn)?.targetField || '';

  const requiredFieldsMapped = fields
    .filter(f => f.required)
    .every(f => mappings.some(m => m.targetField === f.name));

  const getMappedData = () => {
    if (!preview || !preview.sampleRows) return [];
    return preview.sampleRows.map(row => {
      const mappedRow: Record<string, string> = {};
      mappings.forEach(mapping => {
        const field = fields.find(f => f.name === mapping.targetField);
        if (field) {
          mappedRow[field.label] = row[mapping.sourceColumn] || '';
        }
      });
      return mappedRow;
    });
  };

  const ROWS_PER_PAGE = 5;
  const mappedData = getMappedData();
  const totalReviewPages = Math.ceil(mappedData.length / ROWS_PER_PAGE);
  const paginatedData = mappedData.slice(
    reviewPage * ROWS_PER_PAGE,
    (reviewPage + 1) * ROWS_PER_PAGE
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Bulk Import ${entityLabel}`}
      className="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {['upload', 'mapping', 'review', 'complete'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s
                    ? 'bg-blue-600 text-white'
                    : ['upload', 'mapping', 'review', 'complete'].indexOf(step) > index
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
              >
                {['upload', 'mapping', 'review', 'complete'].indexOf(step) > index ? (
                  <Check size={16} />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${['upload', 'mapping', 'review', 'complete'].indexOf(step) > index
                      ? 'bg-emerald-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {previewMutation.isPending ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Processing file...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Button variant="outline" size="sm">
                  Select File
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && preview && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{file?.name}</p>
                  <p className="text-sm text-neutral-500">{preview.totalRows} rows found</p>
                </div>
              </div>
            </div>

            {/* Required fields notice */}
            {!requiredFieldsMapped && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Required fields:</strong> {fields.filter(f => f.required).map(f => f.label).join(', ')}
                </p>
              </div>
            )}

            {/* Mapping Table */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {preview.headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-neutral-900">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">{header}</p>
                      {preview.sampleRows[0] && (
                        <p className="text-xs text-neutral-500 truncate">
                          Sample: {preview.sampleRows[0][header] || '—'}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <select
                      value={getMappedField(header)}
                      onChange={(e) => updateMapping(header, e.target.value)}
                      className="w-48 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Skip —</option>
                      {fields.map(field => (
                        <option key={field.name} value={field.name}>
                          {field.label} {field.required && '*'}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!requiredFieldsMapped || mappings.length === 0}
              >
                Review Data
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Review Import Data
              </h3>
              <span className="text-sm text-neutral-500">
                {preview.totalRows} total rows to import
              </span>
            </div>

            {/* Data Preview Table */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        #
                      </th>
                      {mappings.map(m => {
                        const field = fields.find(f => f.name === m.targetField);
                        return (
                          <th
                            key={m.targetField}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                          >
                            {field?.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="bg-white dark:bg-neutral-900">
                        <td className="px-4 py-3 text-neutral-500">
                          {reviewPage * ROWS_PER_PAGE + idx + 1}
                        </td>
                        {mappings.map(m => {
                          const field = fields.find(f => f.name === m.targetField);
                          return (
                            <td
                              key={m.targetField}
                              className="px-4 py-3 text-neutral-900 dark:text-white truncate max-w-[200px]"
                            >
                              {row[field?.label || ''] || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalReviewPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-sm text-neutral-500">
                    Showing {reviewPage * ROWS_PER_PAGE + 1} - {Math.min((reviewPage + 1) * ROWS_PER_PAGE, mappedData.length)} of {mappedData.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewPage(p => Math.max(0, p - 1))}
                      disabled={reviewPage === 0}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewPage(p => Math.min(totalReviewPages - 1, p + 1))}
                      disabled={reviewPage === totalReviewPages - 1}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                isLoading={importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : `Import ${preview.totalRows} ${entityLabel}`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && result && (
          <div className="text-center py-6">
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${result.failed === 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
                }`}
            >
              {result.failed === 0 ? (
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Import {result.failed === 0 ? 'Complete' : 'Completed with Errors'}
            </h3>

            <div className="flex items-center justify-center gap-8 my-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{result.successful}</p>
                <p className="text-sm text-neutral-500">Successful</p>
              </div>
              {result.failed > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-neutral-500">Failed</p>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-auto">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.message}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>... and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button onClick={handleComplete}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
