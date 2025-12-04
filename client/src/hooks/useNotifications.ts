import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ParticipantJoinedMessage {
  type: "participant_joined";
  dealId: string;
  dealName: string;
  participantName: string;
  newParticipantCount: number;
  newPrice: number;
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

interface DealClosedMessage {
  type: "deal_closed";
  dealId: string;
  dealName: string;
  finalPrice: number;
  participantCount: number;
}

interface DealCancelledMessage {
  type: "deal_cancelled";
  dealId: string;
  dealName: string;
  reason: string;
}

type NotificationMessage = 
  | ParticipantJoinedMessage 
  | TierUnlockedMessage 
  | DealClosedMessage 
  | DealCancelledMessage;

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
          } else if (message.type === "tier_unlocked") {
            const savings = message.oldPrice - message.newPrice;
            
            toast({
              title: "שלב הנחה חדש נפתח!",
              description: `${message.dealName}: ${message.discountPercent}% הנחה - חוסכים ₪${savings.toLocaleString()}!`,
              duration: 8000,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/deals", message.dealId] });
          } else if (message.type === "deal_closed") {
            toast({
              title: "הדיל נסגר בהצלחה!",
              description: `${message.dealName}: המחיר הסופי ₪${message.finalPrice.toLocaleString()}`,
              duration: 10000,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/deals", message.dealId] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
          } else if (message.type === "deal_cancelled") {
            toast({
              title: "הדיל בוטל",
              description: `${message.dealName}: ${message.reason}`,
              variant: "destructive",
              duration: 10000,
            });

            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/deals", message.dealId] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
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
