import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSuperAdminStore } from '../stores/superAdmin';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export function useSuperAdminSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { accessToken } = useSuperAdminStore();

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

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [accessToken]);

    const subscribeToMonitoring = () => {
        socketRef.current?.emit('subscribe_monitoring');
    };

    const unsubscribeFromMonitoring = () => {
        socketRef.current?.emit('unsubscribe_monitoring');
    };

    return {
        socket: socketRef.current,
        isConnected,
        subscribeToMonitoring,
        unsubscribeFromMonitoring,
    };
}
