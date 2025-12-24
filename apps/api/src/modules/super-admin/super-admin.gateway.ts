import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Injectable, Logger } from "@nestjs/common";

interface AuthenticatedSocket extends Socket {
  adminId?: string;
}

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
  namespace: "/super-admin",
})
@Injectable()
export class SuperAdminGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SuperAdminGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided (${client.id})`,
        );
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>("SUPER_ADMIN_JWT_SECRET") ||
        this.configService.get<string>("JWT_SECRET");
      const payload = this.jwtService.verify(token, { secret });

      client.adminId = payload.sub;

      // Join super-admin group
      client.join("super-admins");

      this.logger.log(
        `Super Admin connected: ${client.id} (Admin: ${payload.sub})`,
      );
    } catch (error) {
      this.logger.error(`Super Admin socket auth failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Super Admin disconnected: ${client.id}`);
  }

  @SubscribeMessage("subscribe_monitoring")
  handleSubscribeMonitoring(@ConnectedSocket() client: AuthenticatedSocket) {
    client.join("monitoring");
    return { status: "subscribed", topic: "monitoring" };
  }

  @SubscribeMessage("unsubscribe_monitoring")
  handleUnsubscribeMonitoring(@ConnectedSocket() client: AuthenticatedSocket) {
    client.leave("monitoring");
    return { status: "unsubscribed", topic: "monitoring" };
  }

  @SubscribeMessage("subscribe_security")
  handleSubscribeSecurity(@ConnectedSocket() client: AuthenticatedSocket) {
    client.join("security");
    return { status: "subscribed", topic: "security" };
  }

  /**
   * Broadcast to all connected super admins
   */
  broadcast(event: string, data: any) {
    this.server.to("super-admins").emit(event, data);
  }

  /**
   * Broadcast to monitoring subscribers
   */
  broadcastMonitoring(data: any) {
    this.server.to("monitoring").emit("system_metrics", data);
  }

  /**
   * Broadcast security alert
   */
  broadcastSecurityAlert(alert: any) {
    this.server.to("security").emit("security_alert", alert);
  }
}
