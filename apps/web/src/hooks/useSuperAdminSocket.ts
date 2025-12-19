import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSuperAdminStore } from '../stores/superAdmin';
import { useSuperAdminNotificationStore, SuperAdminNotification } from '../stores/superAdminNotifications';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useSuperAdminSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { accessToken } = useSuperAdminStore();
    const { addNotification, fetchUnreadCount } = useSuperAdminNotificationStore();

    useEffect(() => {
        if (!accessToken) return;

        // Initialize socket with namespace
        const socket = io(`${SOCKET_URL}/super-admin`, {
            auth: {
                token: accessToken,
            },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[SuperAdminSocket] Connected');
            setIsConnected(true);

            // Auto-subscribe to monitoring and security by default for super admins
            socket.emit('subscribe_monitoring');
            socket.emit('subscribe_security');
        });

        socket.on('disconnect', () => {
            console.log('[SuperAdminSocket] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[SuperAdminSocket] Connection Error:', error);
        });

        // Listen for real-time notifications
        socket.on('notification', (notification: SuperAdminNotification) => {
            console.log('[SuperAdminSocket] New notification:', notification);
            addNotification(notification);
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: notification.id,
                });
            }
        });

        // Listen for security alerts
        socket.on('security_alert', (alert: any) => {
            console.log('[SuperAdminSocket] Security alert:', alert);
            // Refresh unread count when security alert arrives
            fetchUnreadCount();
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [accessToken, addNotification, fetchUnreadCount]);

    const subscribeToMonitoring = useCallback(() => {
        socketRef.current?.emit('subscribe_monitoring');
    }, []);

    const unsubscribeFromMonitoring = useCallback(() => {
        socketRef.current?.emit('unsubscribe_monitoring');
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        subscribeToMonitoring,
        unsubscribeFromMonitoring,
        requestNotificationPermission,
    };
}
