// Debug script to check Super Admin session
import { useSuperAdminStore } from './src/stores/superAdmin';

const state = useSuperAdminStore.getState();

console.log('=== Super Admin Session Debug ===');
console.log('Is Authenticated:', state.isAuthenticated);
console.log('Super Admin:', state.superAdmin);
console.log('Access Token:', state.accessToken ? 'Present' : 'Missing');
console.log('Last Activity:', new Date(state.lastActivity).toISOString());
console.log('Session Timeout (minutes):', state.sessionTimeout);

const now = Date.now();
const elapsed = (now - state.lastActivity) / 1000 / 60;
console.log('Minutes since last activity:', elapsed.toFixed(2));
console.log('Is Session Valid:', state.isSessionValid());
console.log('================================');
