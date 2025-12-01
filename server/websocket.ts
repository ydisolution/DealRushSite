import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface NotificationMessage {
  type: "participant_joined";
  dealId: string;
  dealName: string;
  participantName: string;
  newParticipantCount: number;
  newPrice: number;
}

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
