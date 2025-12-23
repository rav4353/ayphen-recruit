/**
 * Generic CSV export utility
 * Converts an array of objects to CSV format with column selection
 */

export interface CsvColumn {
    key: string;
    header: string;
    transform?: (value: any, row: any) => string;
}

export interface CsvExportOptions {
    filename?: string;
    columns?: string[]; // If provided, only these columns will be exported
}

/**
 * Escapes CSV field value
 */
function escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // Check if value contains special characters that need escaping
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        // Escape double quotes by doubling them
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Converts array of objects to CSV string
 */
export function convertToCSV(
    data: any[],
    columnDefinitions: CsvColumn[],
    selectedColumns?: string[]
): string {
    if (!data || data.length === 0) {
        return '';
    }

    // Filter columns based on selection
    const columns = selectedColumns
        ? columnDefinitions.filter(col => selectedColumns.includes(col.key))
        : columnDefinitions;

    // Create header row
    const headers = columns.map(col => escapeCsvValue(col.header)).join(',');

    // Create data rows
    const rows = data.map(row => {
        return columns.map(col => {
            const value = row[col.key];
            const transformedValue = col.transform ? col.transform(value, row) : value;
            return escapeCsvValue(transformedValue);
        }).join(',');
    });

    return [headers, ...rows].join('\n');
}

/**
 * Downloads CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'export.csv'): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Exports data to CSV with column selection
 */
export function exportToCSV(
    data: any[],
    columnDefinitions: CsvColumn[],
    options: CsvExportOptions = {}
): void {
    const csvContent = convertToCSV(data, columnDefinitions, options.columns);
    const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
}

/**
 * Common transformers for CSV values
 */
export const CSV_TRANSFORMERS = {
    date: (value: any) => value ? new Date(value).toLocaleDateString() : '',
    datetime: (value: any) => value ? new Date(value).toLocaleString() : '',
    boolean: (value: any) => value ? 'Yes' : 'No',
    array: (value: any[]) => value && Array.isArray(value) ? value.join('; ') : '',
    number: (value: any) => value !== null && value !== undefined ? String(value) : '',
    currency: (value: any, row: any) => {
        if (!value) return '';
        const currency = row.currency || row.salaryCurrency || 'USD';
        return `${currency} ${Number(value).toLocaleString()}`;
    },
    json: (value: any) => value ? JSON.stringify(value) : '',
};
