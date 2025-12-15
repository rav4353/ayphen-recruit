'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  FileSpreadsheet,
  Users,
  Briefcase,
  Download,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { bulkImportApi } from '../../lib/api';

type EntityType = 'candidates' | 'jobs';
type Step = 'select' | 'upload' | 'mapping' | 'complete';

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
];

const JOB_FIELDS = [
  { name: 'title', label: 'Job Title', required: true },
  { name: 'description', label: 'Description', required: false },
  { name: 'department', label: 'Department', required: false },
  { name: 'location', label: 'Location', required: false },
  { name: 'employmentType', label: 'Employment Type', required: false },
  { name: 'salaryMin', label: 'Minimum Salary', required: false },
  { name: 'salaryMax', label: 'Maximum Salary', required: false },
];

export function BulkImportManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [entityType, setEntityType] = useState<EntityType>('candidates');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = entityType === 'candidates' ? CANDIDATE_FIELDS : JOB_FIELDS;

  const previewMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      const response = entityType === 'candidates'
        ? await bulkImportApi.previewCandidates(selectedFile)
        : await bulkImportApi.previewJobs(selectedFile);
      return response.data;
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
    },
    onError: (err: Error) => {
      setError(err.message || 'Import failed');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      previewMutation.mutate(selectedFile);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = entityType === 'candidates'
        ? await bulkImportApi.getCandidateTemplate()
        : await bulkImportApi.getJobTemplate();
      const blob = new Blob([response.data.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleReset = () => {
    setStep('select');
    setFile(null);
    setPreview(null);
    setMappings([]);
    setResult(null);
    setError(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Bulk Import
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Import candidates or jobs from CSV files
          </p>
        </div>
        {step !== 'select' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </button>
        )}
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
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Select Entity Type */}
      {step === 'select' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setEntityType('candidates')}
              className={`p-6 text-left bg-white dark:bg-neutral-900 border-2 rounded-xl transition-all hover:shadow-md ${
                entityType === 'candidates'
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Import Candidates</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Bulk add candidates from CSV</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setEntityType('jobs')}
              className={`p-6 text-left bg-white dark:bg-neutral-900 border-2 rounded-xl transition-all hover:shadow-md ${
                entityType === 'jobs'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Briefcase className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Import Jobs</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Bulk create job postings</p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload CSV File
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && preview && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{file?.name}</p>
                <p className="text-sm text-neutral-500">{preview.totalRows} rows found</p>
              </div>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Map CSV Columns</h3>
              <p className="text-sm text-neutral-500 mt-1">Match your CSV columns to the system fields</p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {preview.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-white">{header}</p>
                    {preview.sampleRows[0] && (
                      <p className="text-xs text-neutral-500 truncate">
                        Sample: {preview.sampleRows[0][header] || '-'}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  <select
                    value={getMappedField(header)}
                    onChange={(e) => updateMapping(header, e.target.value)}
                    className="w-48 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="">-- Skip --</option>
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
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || mappings.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && result && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            result.failed === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {result.failed === 0 ? (
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Import {result.failed === 0 ? 'Complete' : 'Completed with Errors'}
          </h3>
          
          <div className="flex items-center justify-center gap-6 my-6">
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
            <div className="mt-6 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-48 overflow-auto">
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

          <button
            onClick={handleReset}
            className="mt-6 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
