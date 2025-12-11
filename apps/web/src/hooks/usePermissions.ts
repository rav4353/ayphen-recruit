import { useAuthStore } from '../stores/auth';
import { Permission } from '../lib/permissions';

export function usePermissions() {
    const { user } = useAuthStore();

    const can = (permission: Permission | string) => {
        if (!user) return false;

        // Safety check if permissions strictly undefined (legacy sessions)
        const userPermissions = user.permissions || [];

        return userPermissions.includes(permission);
    };

    return { can, user };
}
