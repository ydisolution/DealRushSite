import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface ParticipantJoinedMessage {
  type: "participant_joined";
  dealId: string;
  dealName: string;
  participantName: string;
  newParticipantCount: number;
  newPrice: number;
}

interface DealCancelledMessage {
  type: "deal_cancelled";
  dealId: string;
  dealName: string;
  reason: string;
}

interface DealClosedMessage {
  type: "deal_closed";
  dealId: string;
  dealName: string;
  finalPrice: number;
  participantCount: number;
}

interface TierUnlockedMessage {
  type: "tier_unlocked";
  dealId: string;
  dealName: string;
  tierNumber: number;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
}

type NotificationMessage = 
  | ParticipantJoinedMessage
  | DealCancelledMessage
  | DealClosedMessage
  | TierUnlockedMessage;

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log("WebSocket client connected");

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log("WebSocket client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });
    });

    console.log("WebSocket server initialized on /ws");
  }

  broadcast(message: NotificationMessage) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  notifyParticipantJoined(
    dealId: string,
    dealName: string,
    participantName: string,
    newParticipantCount: number,
    newPrice: number
  ) {
    this.broadcast({
      type: "participant_joined",
      dealId,
      dealName,
      participantName,
      newParticipantCount,
      newPrice,
    });
  }
}

export const notificationService = new NotificationService();
