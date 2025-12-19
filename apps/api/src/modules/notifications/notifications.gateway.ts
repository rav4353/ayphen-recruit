import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    tenantId?: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets: Map<string, Set<string>> = new Map();

    constructor(
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            client.tenantId = payload.tenantId;

            // Add socket to user's socket set
            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub)!.add(client.id);

            // Join user-specific room
            client.join(`user:${payload.sub}`);
            client.join(`tenant:${payload.tenantId}`);

            // Send unread count on connection
            const unreadCount = await this.notificationsService.getUnreadCount(payload.sub);
            client.emit('unread_count', { count: unreadCount });

            console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        } catch (error) {
            console.error('WebSocket auth failed:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            const userSocketSet = this.userSockets.get(client.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
        }
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('get_notifications')
    async handleGetNotifications(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() filters?: { read?: boolean; type?: string },
    ) {
        if (!client.userId) return;

        const notifications = await this.notificationsService.findAllForUser(
            client.userId,
            filters as any,
        );
        client.emit('notifications', notifications);
    }

    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { notificationId: string },
    ) {
        if (!client.userId) return;

        await this.notificationsService.markAsRead(data.notificationId, client.userId);
        const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
        client.emit('unread_count', { count: unreadCount });
    }

    @SubscribeMessage('mark_all_read')
    async handleMarkAllRead(@ConnectedSocket() client: AuthenticatedSocket) {
        if (!client.userId) return;

        await this.notificationsService.markAllAsRead(client.userId);
        client.emit('unread_count', { count: 0 });
    }

    /**
     * Send notification to specific user(s)
     */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Send notification to all users in a tenant
     */
    sendToTenant(tenantId: string, event: string, data: any) {
        this.server.to(`tenant:${tenantId}`).emit(event, data);
    }

    /**
     * Broadcast new notification to user
     */
    async broadcastNotification(notification: any) {
        this.sendToUser(notification.userId, 'new_notification', notification);

        // Also update unread count
        const unreadCount = await this.notificationsService.getUnreadCount(notification.userId);
        this.sendToUser(notification.userId, 'unread_count', { count: unreadCount });
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean {
        const sockets = this.userSockets.get(userId);
        return sockets ? sockets.size > 0 : false;
    }
}
