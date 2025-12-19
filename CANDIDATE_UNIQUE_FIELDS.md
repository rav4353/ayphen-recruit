# ✅ Candidate Custom Fields - Updated with Optional Unique Constraint

## What Changed

### **"Unique Values Only" Checkbox** ✅

Instead of always checking for duplicates, users can now **optionally** enable unique value enforcement per field.

### **How It Works:**

1. **Add/Edit Field** in Settings → Candidate Form
2. **See two checkboxes:**
   - ☑️ **Required Field** - Makes the field mandatory
   - ☑️ **Unique Values Only** - Prevents duplicate values across all candidates

3. **When "Unique" is checked:**
   - System will validate that no other candidate has the same value for this field
   - Example: Employee ID, Email, Phone Number, Aadhaar Number

4. **When "Unique" is unchecked (default):**
   - Multiple candidates can have the same value
   - Example: City, Skills, Years of Experience

### **Field Display:**

In the settings list, unique fields show:
```
employeeId • text • Required • Unique
```

### **Use Cases:**

**Fields that SHOULD be unique:**
- ✅ Employee ID
- ✅ Email Address
- ✅ Phone Number
- ✅ Aadhaar Number
- ✅ PAN Card
- ✅ Passport Number

**Fields that DON'T need to be unique:**
- ❌ City/Location
- ❌ Years of Experience
- ❌ Skills
- ❌ Education Level
- ❌ Current Company

### **Example Configuration:**

**Field 1: Employee ID**
- Label: "Employee ID"
- Key: "employeeId"
- Type: text
- ☑️ Required
- ☑️ Unique Values Only
- Validation: Alphanumeric

**Field 2: Preferred Location**
- Label: "Preferred Location"
- Key: "preferredLocation"
- Type: text
- ☐ Required
- ☐ Unique Values Only (multiple candidates can prefer same city)

---

## Implementation Details

### **Interface Update:**
```typescript
interface CustomCandidateField {
    id: string;
    label: string;
    key: string;
    type: FieldType;
    required: boolean;
    unique?: boolean;  // NEW: Optional unique constraint
    // ... other properties
}
```

### **Form Modal:**
```tsx
<div className="space-y-3">
    {/* Required Checkbox */}
    <div className="flex items-center gap-2">
        <input type="checkbox" id="field-required" {...register('required')} />
        <label>Required Field</label>
    </div>
    
    {/* Unique Checkbox - NEW */}
    <div className="flex items-start gap-2">
        <input type="checkbox" id="field-unique" {...register('unique')} />
        <div>
            <label>Unique Values Only</label>
            <p className="text-xs text-neutral-500">
                Prevent duplicate values across all candidates for this field
            </p>
        </div>
    </div>
</div>
```

---

## Next: Form Integration

When integrating with the candidate form, you'll need to:

### **1. Check for Duplicates (Only if field.unique === true)**

```typescript
const checkUniqueField = async (fieldKey: string, value: any) => {
  const field = customFields.find(f => f.key === fieldKey);
  
  // Only check if field is marked as unique
  if (!field?.unique) return true;
  
  const response = await candidatesApi.checkFieldValue({
    fieldKey,
    value,
    excludeCandidateId: editingCandidateId // When editing
  });
  
  return !response.data.exists;
};
```

### **2. Backend Endpoint (To Be Created)**

```typescript
// apps/api/src/modules/candidates/candidates.controller.ts
@Post('check-field-value')
async checkFieldValue(@Body() dto: CheckFieldValueDto) {
  const exists = await this.candidatesService.checkCustomFieldValue(
    dto.fieldKey,
    dto.value,
    dto.excludeCandidateId
  );
  return { exists };
}
```

### **3. Service Method**

```typescript
async checkCustomFieldValue(
  fieldKey: string, 
  value: any, 
  excludeCandidateId?: string
) {
  const candidate = await this.prisma.candidate.findFirst({
    where: {
      customFieldValues: {
        path: [fieldKey],
        equals: value
      },
      id: excludeCandidateId ? { not: excludeCandidateId } : undefined
    }
  });
  
  return !!candidate;
}
```

---

## Testing

### **Test Unique Constraint:**

1. **Create a unique field:**
   - Go to Settings → Candidate Form
   - Add Field: "Employee ID"
   - Check ☑️ "Unique Values Only"
   - Save

2. **Add two candidates with same Employee ID:**
   - Candidate 1: Employee ID = "EMP001" → ✅ Saves
   - Candidate 2: Employee ID = "EMP001" → ❌ Error: "This Employee ID is already in use"

3. **Add two candidates with same non-unique field:**
   - Candidate 1: Preferred City = "Mumbai" → ✅ Saves
   - Candidate 2: Preferred City = "Mumbai" → ✅ Saves (allowed)

---

## Summary

✅ **Completed:**
- Added `unique` property to custom fields
- Added "Unique Values Only" checkbox in settings
- Field list shows "Unique" badge
- Default is `false` (duplicates allowed)

🔄 **Next Steps:**
- Implement unique value validation in candidate form
- Add backend endpoint to check for duplicates
- Show error message when duplicate detected

**The settings UI is complete and ready to use!** 🎉
