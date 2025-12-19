# Candidate Custom Fields & Duplicate Check - Implementation Plan

## Overview
Add custom field functionality to the Add Candidate form (similar to jobs) and implement duplicate candidate detection.

## Phase 1: Backend - Custom Fields Support

### 1.1 Update Settings Service
**File:** `apps/api/src/modules/settings/settings.service.ts`

Add support for `candidate_form_config` setting key:
- Similar to `job_form_config`
- Store custom field definitions
- Include field types: text, number, date, dropdown, checkbox

### 1.2 Create DTO
**File:** `apps/api/src/modules/settings/dto/candidate-form-config.dto.ts`

```typescript
export class CustomCandidateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // For dropdown
  placeholder?: string;
  order: number;
}

export class CandidateFormConfigDto {
  customFields: CustomCandidateField[];
  enableDuplicateCheck: boolean;
  duplicateCheckFields: ('email' | 'phone' | 'linkedin')[];
}
```

## Phase 2: Backend - Duplicate Check

### 2.1 Add Duplicate Check Endpoint
**File:** `apps/api/src/modules/candidates/candidates.controller.ts`

```typescript
@Post('check-duplicate')
@UseGuards(JwtAuthGuard)
async checkDuplicate(@Body() dto: CheckDuplicateDto, @CurrentUser() user: JwtPayload) {
  return this.candidatesService.checkDuplicate(dto, user.tenantId);
}
```

### 2.2 Implement Duplicate Logic
**File:** `apps/api/src/modules/candidates/candidates.service.ts`

```typescript
async checkDuplicate(dto: CheckDuplicateDto, tenantId: string) {
  const conditions = [];
  
  if (dto.email) {
    conditions.push({ email: dto.email });
  }
  if (dto.phone) {
    conditions.push({ phone: dto.phone });
  }
  if (dto.linkedinUrl) {
    conditions.push({ linkedinUrl: dto.linkedinUrl });
  }
  
  const duplicates = await this.prisma.candidate.findMany({
    where: {
      tenantId,
      OR: conditions,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      linkedinUrl: true,
      createdAt: true,
    },
  });
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}
```

## Phase 3: Frontend - Settings Page

### 3.1 Create Candidate Form Settings Component
**File:** `apps/web/src/components/settings/CandidateFormSettings.tsx`

Features:
- Add/Edit/Delete custom fields
- Configure field properties (label, type, required, options)
- Reorder fields with drag-and-drop
- Toggle duplicate check
- Select which fields to check for duplicates (email, phone, LinkedIn)

Similar structure to `JobFormSettings.tsx`

### 3.2 Add to Settings Page
**File:** `apps/web/src/pages/settings/SettingsPage.tsx`

Add new tab: "Candidate Form"

## Phase 4: Frontend - Update Candidate Form

### 4.1 Fetch Custom Fields Configuration
**File:** `apps/web/src/components/candidates/CandidateForm.tsx`

```typescript
const [customFields, setCustomFields] = useState<CustomField[]>([]);
const [duplicateCheckConfig, setDuplicateCheckConfig] = useState<any>(null);

useEffect(() => {
  fetchCandidateFormConfig();
}, []);

const fetchCandidateFormConfig = async () => {
  const response = await settingsApi.get('candidate_form_config');
  const config = response.data?.data?.value || { customFields: [], enableDuplicateCheck: false };
  setCustomFields(config.customFields);
  setDuplicateCheckConfig(config);
};
```

### 4.2 Render Custom Fields
Add custom fields section after standard fields:

```tsx
{/* Custom Fields Section */}
{customFields.length > 0 && (
  <Card className="p-6">
    <h3 className="font-semibold mb-4">Additional Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {customFields.map((field) => (
        <div key={field.id}>
          {renderCustomField(field)}
        </div>
      ))}
    </div>
  </Card>
)}
```

### 4.3 Implement Duplicate Check
Add duplicate check on email/phone/LinkedIn blur:

```typescript
const checkForDuplicates = async () => {
  if (!duplicateCheckConfig?.enableDuplicateCheck) return;
  
  const email = watch('email');
  const phone = watch('phone');
  const linkedinUrl = watch('linkedinUrl');
  
  const response = await candidatesApi.checkDuplicate({
    email,
    phone,
    linkedinUrl,
  });
  
  if (response.data.hasDuplicates) {
    setDuplicateWarning({
      show: true,
      duplicates: response.data.duplicates,
    });
  }
};
```

### 4.4 Show Duplicate Warning Modal
```tsx
{duplicateWarning.show && (
  <DuplicateWarningModal
    duplicates={duplicateWarning.duplicates}
    onContinue={() => setDuplicateWarning({ show: false, duplicates: [] })}
    onCancel={() => navigate(-1)}
  />
)}
```

## Phase 5: API Integration

### 5.1 Add API Methods
**File:** `apps/web/src/lib/api.ts`

```typescript
export const candidatesApi = {
  // ... existing methods
  checkDuplicate: (data: { email?: string; phone?: string; linkedinUrl?: string }) =>
    api.post('/candidates/check-duplicate', data),
};
```

## Phase 6: Database Schema (If needed)

If you want to store custom field values:

**File:** `apps/api/prisma/schema.prisma`

```prisma
model Candidate {
  // ... existing fields
  customFieldValues Json? // Store custom field data as JSON
}
```

## Implementation Priority

1. **High Priority:**
   - Duplicate check functionality (most requested)
   - Basic custom fields (text, textarea, dropdown)

2. **Medium Priority:**
   - Settings UI for managing custom fields
   - Advanced field types (date, number, checkbox)

3. **Low Priority:**
   - Field reordering
   - Field validation rules
   - Conditional fields

## Estimated Time
- Phase 1-2 (Backend): 2-3 hours
- Phase 3 (Settings UI): 2-3 hours  
- Phase 4 (Form Integration): 3-4 hours
- Phase 5 (API Integration): 1 hour
- Testing & Polish: 2 hours

**Total: 10-13 hours**

## Quick Win: Duplicate Check Only

If you want just the duplicate check feature first:
1. Implement Phase 2 (Backend duplicate check) - 1 hour
2. Add duplicate check to form (Phase 4.3-4.4) - 2 hours
3. Total: 3 hours

Would you like me to implement the duplicate check feature first, or start with the full custom fields implementation?
