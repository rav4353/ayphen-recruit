# CSV Export - Audit Logs Troubleshooting Guide

## ✅ Implementation Summary

I've successfully implemented the column selector for the **Audit Logs** page. Here's what was added:

### Files Modified:
`/apps/web/src/pages/super-admin/AuditLogsPage.tsx`

### Changes Made:

1. **Added Imports:**
```tsx
import { ColumnSelector, ExportColumn } from '../../components/common';
import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../../lib/csv-utils';
```

2. **Added State:**
```tsx
const [showColumnSelector, setShowColumnSelector] = useState(false);
```

3. **Defined Export Columns (12 fields):**
- Log ID
- Timestamp ✓ (default selected)
- Action ✓ (default selected)
- Entity Type ✓ (default selected)
- Entity ID
- User Name ✓ (default selected)
- User ID
- Tenant Name ✓ (default selected)
- Tenant ID
- IP Address ✓ (default selected)
- User Agent
- Details (JSON)

4. **Updated "Archive Dump" Button (Line 210):**
```tsx
onClick={() => setShowColumnSelector(true)}
```

5. **Added ColumnSelector Modal (Lines 502-511):**
```tsx
<ColumnSelector
  isOpen={showColumnSelector}
  onClose={() => setShowColumnSelector(false)}
  columns={exportColumns}
  onExport={handleExportWithColumns}
  title="Select Audit Log Fields to Export"
  description="Choose which audit trail details you want in your CSV archive"
  exportButtonText="Download Archive"
/>
```

---

## 🔍 How to Test

### Step 1: Navigate to Audit Logs
1. Go to: `http://localhost:5173`
2. Login if required
3. Navigate to: **Super Admin** → **Audit Logs**

### Step 2: Test Export Button
1. Look for the **"Archive Dump"** button in the top right
2. Click the button
3. **Expected Result**: A modal should open with title "Select Audit Log Fields to Export"

### Step 3: Test Column Selection
1. In the modal, you should see checkboxes for 12 fields
2. 6 fields should be selected by default (Timestamp, Action, Entity Type, User Name, Tenant Name, IP Address)
3. Try clicking "Select All" and "Deselect All"
4. Select some columns
5. Click "Download Archive"
6. **Expected Result**: CSV file downloads with only the selected columns

---

## 🐛 Troubleshooting

### Issue 1: Modal Doesn't Open

**Check the Browser Console (F12):**
Press F12 → Go to "Console" tab → Look for errors

**Common Errors:**
- `ColumnSelector is not defined` → Component not imported correctly
- `Modal is not defined` → Modal component missing
- `Cannot read property 'map' of undefined` → Data issue

**Solution:**
```bash
# Hard refresh the browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or clear cache
Ctrl + Shift + Delete
```

### Issue 2: "Archive Dump" Button Missing

**Possible Causes:**
- Page hasn't refreshed since code change
- Build error preventing compilation

**Check Terminal:**
Look for compilation errors in the `npm run dev` terminal

### Issue 3: CSV Doesn't Download

**Check:**
1. Are there audit logs on the page? (Empty data won't export)
2. Did you select at least one column?
3. Check browser's download settings

---

## 🔧 Manual Verification

### Verify Imports (Line 23-24):
```bash
grep -n "ColumnSelector\|csv-utils" apps/web/src/pages/super-admin/AuditLogsPage.tsx
```

**Expected Output:**
```
23:import { ColumnSelector, ExportColumn } from '../../components/common';
24:import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../../lib/csv-utils';
```

### Verify State (Line 76):
```bash
grep -n "showColumnSelector" apps/web/src/pages/super-admin/AuditLogsPage.tsx | head -5
```

**Expected Output:**
```
76:  const [showColumnSelector, setShowColumnSelector] = useState(false);
210:            onClick={() => setShowColumnSelector(true)}
504:        isOpen={showColumnSelector}
505:        onClose={() => setShowColumnSelector(false)}
```

### Verify Modal (Lines 502-511):
```bash
grep -A 10 "Column Selector Modal" apps/web/src/pages/super-admin/AuditLogsPage.tsx
```

**Expected Output:**
```
      {/* Column Selector Modal */}
      <ColumnSelector
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        columns={exportColumns}
        onExport={handleExportWithColumns}
        title="Select Audit Log Fields to Export"
        description="Choose which audit trail details you want in your CSV archive"
        exportButtonText="Download Archive"
      />
```

---

## 📸 What You Should See

### Before Clicking Export:
- Button labeled "Archive Dump" with a download icon
- Button should be in the top-right area of the page

### After Clicking Export:
- Modal overlay (dark background)
- White modal window with title "Select Audit Log Fields to Export"
- List of 12 checkboxes (6 checked by default)
- "Select All" and "Deselect All" links
- "Cancel" and "Download Archive" buttons at the bottom

### After Clicking Download:
- CSV file downloads to your default download directory
- File named like: `audit-logs_2025-12-23.csv`
- File contains only the columns you selected

---

## ✅ Verification Checklist

- [ ] Code compiles without errors (`npm run dev` shows no errors)
- [ ] TypeScript has no errors (`npm run type-check` passes)
- [ ] "Archive Dump" button appears on Audit Logs page
- [ ] Modal opens when clicking the button
- [ ] 12 fields are shown in the modal
- [ ] Checkboxes are clickable
- [ ] CSV downloads when clicking "Download Archive"
- [ ] CSV contains only selected columns

---

## 🚨 If Still Not Working

Please provide:
1. **Browser Console Errors** (F12 → Console tab → screenshot any red errors)
2. **Terminal Output** (any errors from `npm run dev`)
3. **What happens when you click "Archive Dump"?**
   - Nothing?
   - Error message?
   - Modal opens but looks broken?
4. **Screenshot of the Audit Logs page**

---

## 📝 Notes

### About Reports Page

The **Reports Page** is different:
- It generates aggregated analytics data server-side
- Export goes directly to backend API
- Data is computed on-the-fly, not displayed in a table
- Column selector doesn't apply to Reports

**Reports already has working CSV export** (line 351 in ReportsPage.tsx)
- It exports via the backend API: `reportsApi.exportCsv()`
- This is the correct implementation for Reports
- No column selection needed

---

## ✨ Expected Behavior

**Working Implementation:**
1. Click "Archive Dump" → Modal opens instantly
2. Select columns → Checkboxes update
3. Click "Download Archive" → CSV downloads
4. CSV contains only selected columns with proper headers
5. Timestamps formatted as datetime
6. JSON details properly stringified

**This should work exactly like the Jobs and Candidates export!**

