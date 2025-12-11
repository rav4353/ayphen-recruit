# Status Colors - Backend-Driven Implementation

## Overview
Status colors are now included directly in API responses, similar to the product API pattern. Each job and application status includes color information in the response.

## Implementation Pattern

### Backend Response Format
```json
{
  "id": "job-123",
  "title": "Senior Developer",
  "status": "OPEN",
  "statusInfo": {
    "name": "OPEN",
    "code": "OPEN",
    "fontColor": "#065F46",
    "bgColor": "#D1FAE5",
    "borderColor": "#065F46"
  },
  ...
}
```

This matches the pattern from your product API where status includes:
- `fontColor`: Text color
- `bgColor`: Background color  
- `borderColor`: Border color (same as font color)
- `name`: Display name
- `code`: Status code

## Backend Changes

### 1. Jobs Service (`apps/api/src/modules/jobs/jobs.service.ts`)
- **Injected** `SettingsService` to access status colors
- **Added** `enrichJobWithStatusColor()` method to add statusInfo to individual jobs
- **Added** `enrichJobsWithStatusColors()` method to batch process jobs
- **Fetches** colors from database settings
- **Falls back** to default colors if settings not found

### 2. Jobs Controller (`apps/api/src/modules/jobs/jobs.controller.ts`)
- **Updated** `findAll()` to enrich jobs before returning
- **Updated** `findOne()` to enrich single job
- All job endpoints now return jobs with `statusInfo` included

### 3. Settings Service (`apps/api/src/modules/settings/settings.service.ts`)
- **Added** `getStatusColors()` method to fetch colors from database
- **Added** `resetStatusColors()` method to reset to defaults
- **Returns** default colors if not configured

### 4. Settings Controller (`apps/api/src/modules/settings/settings.controller.ts`)
- **Added** `GET /settings/status-colors` endpoint
- **Added** `POST /settings/status-colors/reset` endpoint
- **Returns** consistent `{ data: colors }` format

## Frontend Changes

### 1. StatusBadge Component (`apps/web/src/components/ui/StatusBadge.tsx`)
- **Updated** to accept `statusInfo` prop from API
- **Falls back** to context-based colors if statusInfo not provided
- **Supports** both new (statusInfo) and old (status + type) patterns

Usage:
```tsx
// New way - using API response
<StatusBadge statusInfo={job.statusInfo} />

// Old way - still works for backward compatibility
<StatusBadge status={job.status} type="job" />
```

### 2. Job Type (`apps/web/src/lib/types.ts`)
- **Added** `statusInfo` field to Job interface
- Matches backend response structure

### 3. JobsPage (`apps/web/src/pages/jobs/JobsPage.tsx`)
- **Updated** to use `statusInfo` from API response
- No longer needs to pass `status` and `type` separately

## Benefits

✅ **Single Source of Truth**: Colors come from backend database
✅ **Consistent with Product API**: Same pattern as existing product status colors
✅ **No Extra API Calls**: Colors included in existing job/application responses
✅ **Tenant-Specific**: Each tenant can have custom colors
✅ **Persistent**: Colors stored in database, survive page refreshes
✅ **Fallback Support**: Defaults to standard colors if not configured

## Migration Path

The implementation supports both patterns:
1. **New**: Pass `statusInfo` from API response
2. **Old**: Pass `status` + `type` (uses context)

This allows gradual migration of components.

## Next Steps

1. ✅ Update JobsPage to use statusInfo
2. ⏳ Update JobDetailPage to use statusInfo  
3. ⏳ Update ApplicationsService to include statusInfo
4. ⏳ Update Pipeline/Kanban views to use statusInfo
5. ⏳ Update all dashboard widgets to use statusInfo
6. ⏳ Remove StatusColorContext once all components migrated

## Testing

1. Navigate to Jobs page - statuses should show with colors
2. Open Settings > Appearance - customize colors
3. Save changes - colors should update immediately
4. Refresh page - colors should persist
5. Reset to defaults - colors should revert
