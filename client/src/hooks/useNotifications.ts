import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface NotificationMessage {
  type: "participant_joined";
  dealId: string;
  dealName: string;
  participantName: string;
  newParticipantCount: number;
  newPrice: number;
}

export function useNotifications() {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          
          if (message.type === "participant_joined") {
            const initials = message.participantName
              .split(" ")
              .map(n => n[0])
              .join(".")
              .concat(".");

            toast({
              title: "משתתף חדש הצטרף!",
              description: `${initials} הצטרף/ה ל"${message.dealName}" - כעת ${message.newParticipantCount} משתתפים`,
              duration: 5000,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/deals", message.dealId] });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 3s...");
        wsRef.current = null;
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [toast]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return null;
}
