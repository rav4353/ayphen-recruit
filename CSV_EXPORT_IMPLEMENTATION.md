# CSV Export with Column Selection - Implementation Guide

## ✅ Feature Implemented

I've created a flexible column selection system for CSV exports throughout your application.

### **New Components Created:**

#### 1. **ColumnSelector Component**
**Location**: `/apps/web/src/components/common/ColumnSelector.tsx`

Reusable modal component that allows users to:
- Select/deselect specific columns for export
- Quick "Select All" / "Deselect All" actions
- Visual feedback with checkboxes
- Count of selected columns
- Loading state during export

**Usage Example**:
```tsx
import { ColumnSelector, ExportColumn } from '../components/common/ColumnSelector';

const columns: ExportColumn[] = [
  { key: 'id', label: 'Job ID', defaultSelected: true },
  { key: 'title', label: 'Job Title', defaultSelected: true },
  { key: 'department', label: 'Department', defaultSelected: true },
  { key: 'status', label: 'Status', defaultSelected: true },
  { key: 'applicants', label: 'Number of Applicants', defaultSelected: false },
  { key: 'createdAt', label: 'Created Date', defaultSelected: false },
];

<ColumnSelector
  isOpen={showColumnSelector}
  onClose={() => setShowColumnSelector(false)}
  columns={columns}
  onExport={handleExportWithColumns}
  title="Select Job Fields to Export"
  description="Choose which job details you want in your CSV"
/>
```

#### 2. **CSV Utility Functions**
**Location**: `/apps/web/src/lib/csv-utils.ts`

Provides:
- `convertToCSV()` - Convert array of objects to CSV with column filtering
- `downloadCSV()` - Trigger browser download of CSV file
- `exportToCSV()` - Complete export flow
- `CSV_TRANSFORMERS` - Common value transformers (dates, booleans, arrays, currency, etc.)

**Usage Example**:
```tsx
import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../lib/csv-utils';

const columnDefs: CsvColumn[] = [
  { key: 'id', header: 'Job ID' },
  { key: 'title', header: 'Job Title' },
  { key: 'status', header: 'Status' },
  { 
    key: 'createdAt', 
    header: 'Created Date',
    transform: CSV_TRANSFORMERS.date 
  },
  {
    key: 'salaryMax',
    header: 'Max Salary',
    transform: CSV_TRANSFORMERS.currency
  },
];

const csvContent = convertToCSV(jobs, columnDefs, selectedColumns);
downloadCSV(csvContent, 'jobs_export.csv');
```

### **How to Implement in Your Pages:**

#### Example: Jobs Page with Column Selection

```tsx
import { useState } from 'react';
import { ColumnSelector, ExportColumn } from '../../components/common/ColumnSelector';
import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../../lib/csv-utils';

export function JobsPage() {
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // Define available columns for export
  const exportColumns: ExportColumn[] = [
    { key: 'jobCode', label: 'Job ID', defaultSelected: true },
    { key: 'title', label: 'Job Title', defaultSelected: true },
    { key: 'department', label: 'Department', defaultSelected: true },
    { key: 'location', label: 'Location', defaultSelected: true },
    { key: 'status', label: 'Status', defaultSelected: true },
    { key: 'employmentType', label: 'Employment Type', defaultSelected: false },
    { key: 'applicants', label: 'Number of Applicants', defaultSelected: true },
    { key: 'hiringManager', label: 'Hiring Manager', defaultSelected: false },
    { key: 'recruiter', label: 'Recruiter', defaultSelected: false },
    { key: 'salaryMin', label: 'Minimum Salary', defaultSelected: false },
    { key: 'salaryMax', label: 'Maximum Salary', defaultSelected: false },
    { key: 'createdAt', label: 'Created Date', defaultSelected: true },
    { key: 'publishedAt', label: 'Published Date', defaultSelected: false },
  ];

  // Column definitions for CSV transformation
  const csvColumns: CsvColumn[] = [
    { key: 'jobCode', header: 'Job ID' },
    { key: 'title', header: 'Job Title' },
    { 
      key: 'department', 
      header: 'Department',
      transform: (val, row) => row.department?.name || ''
    },
    {
      key: 'location',
      header: 'Location',
      transform: (val, row) => row.locations?.map(l => l.name).join('; ') || ''
    },
    { key: 'status', header: 'Status' },
    { key: 'employmentType', header: 'Employment Type' },
    {
      key: 'applicants',
      header: 'Number of Applicants',
      transform: (val, row) => row._count?.applications || 0
    },
    {
      key: 'hiringManager',
      header: 'Hiring Manager',
      transform: (val, row) => row.hiringManager 
        ? `${row.hiringManager.firstName} ${row.hiringManager.lastName}`
        : ''
    },
    {
      key: 'recruiter',
      header: 'Recruiter',
      transform: (val, row) => row.recruiter 
        ? `${row.recruiter.firstName} ${row.recruiter.lastName}`
        : ''
    },
    {
      key: 'salaryMin',
      header: 'Minimum Salary',
      transform: CSV_TRANSFORMERS.currency
    },
    {
      key: 'salaryMax',
      header: 'Maximum Salary',
      transform: CSV_TRANSFORMERS.currency
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      transform: CSV_TRANSFORMERS.date
    },
    {
      key: 'publishedAt',
      header: 'Published Date',
      transform: CSV_TRANSFORMERS.date
    },
  ];

  const handleExportWithColumns = (selectedColumns: string[]) => {
    const csvContent = convertToCSV(jobs, csvColumns, selectedColumns);
    downloadCSV(csvContent, `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div>
      {/* Replace your current export button */}
      <Button onClick={() => setShowColumnSelector(true)}>
        <Download size={16} />
        Export
      </Button>

      {/* Add the column selector modal */}
      <ColumnSelector
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        columns={exportColumns}
        onExport={handleExportWithColumns}
        title="Select Job Fields to Export"
        description="Choose which job details you want in your CSV download"
        exportButtonText="Download CSV"
      />
    </div>
  );
}
```

### **Key Features:**

✅ **Reusable** - Can be used on any page (Jobs, Candidates, Applications, etc.)
✅ **Customizable** - Define which columns are available and their default selection
✅ **Flexible Transformers** - Built-in transformers for dates, arrays, currency, etc.
✅ **Client-side Processing** - No backend changes required (data already loaded)
✅ **User-friendly** - Clear UI with select all/deselect all options
✅ **Type-safe** - Full TypeScript support

### **Next Steps:**

1. **Add to JobsPage** - Replace current export with column selector
2. **Add to CandidatesPage** - Implement for candidate exports
3. **Add to ApplicationsPage** - Implement for application exports
4. **Add to ReportsPage** - Implement for report exports

### **Optional Backend Enhancement:**

For server-side exports (large datasets), you can extend the API to accept column selection:

```typescript
// Add to jobs export endpoint
export: (tenantId: string, params?: {
  columns?: string[]; // Add this parameter
  search?: string;
  status?: string;
  // ... other filters
}) => api.get(`/${tenantId}/jobs/export`, { params, responseType: 'blob' })
```

This allows both client-side (for already loaded data) and server-side (for large exports) column selection.
