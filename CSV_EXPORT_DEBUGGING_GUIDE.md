# 🔍 CSV Export Debugging - Step by Step Guide

## ✅ Latest Changes - Debugging Added

I've added console logging to help us identify the exact issue:

### Added Debugging:
1. **Button Click**: Logs when "Archive Dump" is clicked
2. **Modal State**: Logs when modal state changes
3. **Export Function**: Logs when export is called with data
4. **Empty Data Check**: Shows error if no logs to export

---

## 📋 Testing Steps

### Step 1: Open Browser Console
**Before doing anything else:**

1. Open your browser (Chrome/Firefox/Edge)
2. Press `F12` (or `Cmd+Option+I` on Mac)
3. Click the **"Console"** tab
4. Keep it open while testing

### Step 2: Navigate to Audit Logs
1. Go to: `http://localhost:5173`
2. Login if needed
3. Navigate to: **Super Admin** → **Audit Logs**

### Step 3: Click "Archive Dump" Button
Look for the button in the top-right corner and click it.

**Watch the Console** - You should see:
```
Archive Dump clicked, opening modal
Modal state changed: true
```

### Step 4: Check What Happens

#### ✅ **If Modal Opens** (Expected):
You'll see a white modal window with:
- Title: "Select Audit Log Fields to Export"
- 12 checkboxes
- "Select All" / "Deselect All" links
- "Cancel" and "Download Archive" buttons

**→ Click "Download Archive"**

Console should show:
```
Export called with columns: [...selected column keys...]
Logs data: [...array of log objects...]
```

Then CSV downloads!

#### ❌ **If Modal Doesn't Open**:
Check console for errors. Common issues:

**a) No console logs at all**
- Button might not be rendered
- JavaScript might be disabled
- Page might not have loaded

**b) Console shows error like:**
```
Cannot find module 'ColumnSelector'
```
→ Component import issue

**c) Console shows:**
```
Archive Dump clicked, opening modal
Modal state changed: true
```
But modal still doesn't appear → Rendering issue

---

## 🐛 Common Issues & Solutions

### Issue 1: "No audit logs to export" toast

**Cause**: The page has no audit log data

**Solution**:
1. Make sure you have audit logs (perform some actions to generate logs)
2. Check if the table shows any logs
3. If table is empty, the export will fail (expected behavior)

### Issue 2: Modal appears but is blank/broken

**Possible causes**:
- CSS not loaded
- Component structure issue

**Check**:
- Does the Jobs or Candidates export work?
- If those work but Audit Logs doesn't, there might be something specific to this page

### Issue 3: Button doesn't respond

**Check Console for**:
```
Archive Dump clicked, opening modal
```

**If you don't see this message:**
- Button click handler isn't working
- JavaScript error preventing execution

### Issue 4: Modal state changes but modal doesn't show

**If console shows:**
```
Modal state changed: true
```
But you don't see the modal...

**Check**:
- Is there a backdrop (dark overlay)? Click it
- Press `Escape` key
- Check if modal is behind other elements (z-index issue)

---

## 🧪 Quick Test Comparison

### Test on Jobs Page (Known Working):
1. Go to: Jobs page
2. Click "Export" button (top right)
3. Modal should open
4. Select columns
5. Click "Download CSV"

**If Jobs export works but Audit Logs doesn't:**
- Compare console logs between both
- Note any differences in error messages

---

## 📸 Expected Console Output (Success Case)

When everything works correctly, console should show:

```javascript
// When page loads
Modal state changed: false

// When you click "Archive Dump"
Archive Dump clicked, opening modal
Modal state changed: true

// When you click "Download Archive"
Export called with columns: ["createdAt", "action", "entityType", "userName", "tenantName", "ipAddress"]
Logs data: [
  {
    id: "...",
    action: "LOGIN",
    entityType: "USER",
    userName: "John Doe",
    ...
  },
  ...
]
```

Then CSV downloads!

---

## 🔧 Manual Fixes

### If Hot Reload Isn't Working:

```bash
# Stop the dev server (Ctrl+C)
# Then restart
cd /Users/ravanthrajas/Documents/ayphen-recruit
npm run dev
```

### Clear Browser Cache:
```
Ctrl + Shift + Delete (Windows/Linux)
Cmd + Shift + Delete (Mac)
```

Check:
- [x] Disable cache
- [x] Clear cookies
- [x] Clear cached images and files

Then **hard refresh**: `Ctrl+Shift+R`

---

## 📞 What to Report

If still not working, please share:

### 1. Console Output
Copy-paste **ALL** console messages (especially errors in red)

### 2. What Happens
- Does button appear?
- Does clicking do anything?
- Does modal appear at all?
- Is modal blank or shows content?

### 3. Browser Info
- Chrome / Firefox / Safari?
- Version?

### 4. Comparison
- Does Jobs export work?
- Does Candidates export work?

---

## ✨ What Should Work

**Complete Flow:**
1. Navigate to Audit Logs ✅
2. See "Archive Dump" button ✅
3. Click button
4. See console: "Archive Dump clicked, opening modal" ✅
5. See console: "Modal state changed: true" ✅
6. Modal appears on screen ✅
7. Select columns ✅
8. Click "Download Archive"
9. See console: "Export called with columns: [...]" ✅
10. CSV downloads ✅

**The debugging logs will tell us exactly where it's failing!**

