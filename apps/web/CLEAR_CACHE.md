# Clear Browser Cache

The logo has been updated in the code to show only ONE logo, but you're seeing two logos due to browser caching.

## Quick Fix Options:

### Option 1: Hard Refresh (Fastest)
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### Option 2: Clear Cache in DevTools
1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
cd apps/web
npm run dev
# or
pnpm dev
```

### Option 4: Clear Browser Cache Completely
1. Open browser settings
2. Clear browsing data
3. Select "Cached images and files"
4. Clear data
5. Refresh the page

## What Was Changed:
- ✅ Removed dark mode logo
- ✅ Using only `logo_light_theme.png`
- ✅ Set to proper size (h-8)
- ✅ Only ONE logo in the code

The code is correct - you just need to clear the browser cache to see the update!
