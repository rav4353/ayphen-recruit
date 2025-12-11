# Fixes for User Invitation and Management

## Objective
The user reported issues with not receiving emails when inviting users and errors in `UserManagementSettings.tsx`.

## Changes Implemented

### 1. Email Notification for User Invites
- **`apps/api/src/common/services/email.service.ts`**: Added `sendInvitationEmail` method to generate and send an HTML email with the temporary password and login link.
- **`apps/api/src/modules/users/users.service.ts`**:
    - Injected `EmailService` into `UsersService`.
    - Updated the `create` method to call `sendInvitationEmail` when a password is provided (indicating an admin invite flow).

### 2. Fixes in `UserManagementSettings.tsx`
- **Fixed Role Counts**: The `roles` state was initialized once and never updated. Changed it to a derived variable that recalculates counts whenever the `users` list changes.
- **Fixed Build Errors**:
    - Added missing import for `CardHeader`.
    - Corrected `ConfirmationModal` prop usage (changed `onClose` to `onCancel`).

## Verification Results

### Automated Browser Testing
A browser automation session verified the following:
1.  **Invite User**: Successfully invited "Email Test" as a "Recruiter".
2.  **User List Update**: Confirmed the new user appeared in the list.
3.  **Role Count Update**: Confirmed the "Recruiter" count in the "Roles & Permissions" tab increased correctly, verifying the fix for the roles logic.

### Build Verification
- Ran `npm run build` in `apps/web` and confirmed it completed successfully with no errors.

## Conclusion
The email invitation logic is now implemented on the backend, and the frontend errors in `UserManagementSettings.tsx` have been resolved. The application builds correctly and the user management features are functioning as expected.
