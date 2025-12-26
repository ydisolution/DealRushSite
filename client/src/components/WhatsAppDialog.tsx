import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Order } from "@/lib/orderHelpers";

interface WhatsAppDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppDialog({ order, open, onOpenChange }: WhatsAppDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [includeOrderDetails, setIncludeOrderDetails] = useState(true);

  const sendWhatsAppMutation = useMutation({
    mutationFn: async ({ orderId, message, includeOrderDetails }: { 
      orderId: string; 
      message: string;
      includeOrderDetails: boolean;
    }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message, includeOrderDetails }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ 
        title: "✅ הודעה נשלחה",
        description: "הודעת WhatsApp נשלחה בהצלחה ללקוח"
      });
      setMessage("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ שגיאה", 
        description: error.message || "שליחת ההודעה נכשלה",
        variant: "destructive" 
      });
    },
  });

  const requestCoordinationMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/request-coordination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ 
        title: "✅ בקשת תיאום נשלחה",
        description: "הלקוח יקבל הודעת WhatsApp לתיאום המשלוח"
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ שגיאה", 
        description: error.message || "שליחת הבקשה נכשלה",
        variant: "destructive" 
      });
    },
  });

  const handleSend = () => {
    if (!order || !message.trim()) return;
    
    sendWhatsAppMutation.mutate({
      orderId: order.id,
      message: message.trim(),
      includeOrderDetails,
    });
  };

  const handleRequestCoordination = () => {
    if (!order) return;
    requestCoordinationMutation.mutate(order.id);
  };

  if (!order) return null;

  const hasPhone = !!order.customerPhone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            שליחת הודעת WhatsApp
          </DialogTitle>
          <DialogDescription>
            שלח הודעה ישירה ללקוח דרך WhatsApp
          </DialogDescription>
        </DialogHeader>

        {!hasPhone ? (
          <div className="text-center py-6">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              ללקוח הזה אין מספר טלפון מוגדר
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-semibold">{order.customerName}</p>
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <MessageCircle className="h-3 w-3" />
                {order.customerPhone}
              </p>
              <p className="text-xs text-gray-600">{order.dealName}</p>
            </div>

            {/* Quick Actions */}
            <div className="border rounded-lg p-3">
              <Label className="text-sm font-semibold mb-2 block">פעולות מהירות</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleRequestCoordination}
                disabled={requestCoordinationMutation.isPending}
              >
                {requestCoordinationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 ml-2" />
                )}
                בקשת תיאום משלוח
              </Button>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold">
                הודעה מותאמת אישית
              </Label>
              <Textarea
                id="message"
                placeholder="כתוב את ההודעה שלך כאן..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="include-details"
                  checked={includeOrderDetails}
                  onCheckedChange={(checked) => setIncludeOrderDetails(checked as boolean)}
                />
                <Label
                  htmlFor="include-details"
                  className="text-sm font-normal cursor-pointer"
                >
                  כלול פרטי הזמנה בהודעה
                </Label>
              </div>
            </div>

            {/* Preview */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <Label className="text-xs font-semibold text-green-800 mb-1 block">
                  תצוגה מקדימה:
                </Label>
                <div className="text-xs text-gray-700 whitespace-pre-wrap">
                  {includeOrderDetails ? (
                    <>
                      📦 <strong>עדכון הזמנה</strong>
                      <br /><br />
                      שלום {order.customerName},
                      <br /><br />
                      {message}
                      <br /><br />
                      <strong>פרטי ההזמנה:</strong>
                      <br />
                      📦 {order.dealName}
                      <br />
                      🔢 מספר הזמנה: {order.id.slice(0, 8)}
                      <br />
                      📍 סטטוס: {order.status}
                      <br /><br />
                      <strong>DealRush</strong> 💜
                    </>
                  ) : (
                    message
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          {hasPhone && (
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendWhatsAppMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendWhatsAppMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  שלח WhatsApp
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
