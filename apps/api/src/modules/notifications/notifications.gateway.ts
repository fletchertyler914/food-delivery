import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

interface JwtAccessPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: string;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

@WebSocketGateway({ namespace: "/realtime" })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService
  ) {}

  afterInit(server: Server): void {
    const allowedOrigins = this.config.getOrThrow<readonly string[]>("WEB_ORIGIN");
    const engine = server.engine as { opts?: { cors?: unknown } } | undefined;
    if (!engine?.opts) {
      this.logger.warn("Socket.IO engine not ready; CORS will use gateway defaults.");
      return;
    }

    engine.opts.cors = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed.`), false);
      },
      credentials: true
    };
  }

  handleConnection(client: Socket): void {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.debug({ socketId: client.id, reason: "missing token" });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify<JwtAccessPayload>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET")
      });
      void client.join(userRoom(payload.sub));
      this.logger.debug({ socketId: client.id, userId: payload.sub, event: "connected" });
    } catch (error) {
      const reason = error instanceof Error ? error.name : "invalid token";
      this.logger.debug({ socketId: client.id, reason });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug({ socketId: client.id, event: "disconnected" });
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  emitToUsers(userIds: readonly string[], event: string, payload: unknown): void {
    const unique = Array.from(new Set(userIds));
    for (const userId of unique) {
      this.emitToUser(userId, event, payload);
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    if (typeof auth?.token === "string" && auth.token.length > 0) {
      return auth.token;
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice("Bearer ".length);
    }
    return undefined;
  }
}
