import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Flag,
  AlertTriangle,
  X,
  MessageCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Order, getSLAStatus, getPriorityConfig } from "@/lib/orderHelpers";
import WhatsAppDialog from "./WhatsAppDialog";

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; label: string; bgColor: string }> = {
    pending: { color: "text-gray-600", label: "הזמנה חדשה", bgColor: "bg-gray-100" },
    verified: { color: "text-blue-600", label: "תשלום אומת", bgColor: "bg-blue-100" },
    needs_coordination: { color: "text-yellow-600", label: "טעון תיאום", bgColor: "bg-yellow-100" },
    scheduled: { color: "text-purple-600", label: "קביעת זמן משלוח", bgColor: "bg-purple-100" },
    out_for_delivery: { color: "text-orange-600", label: "יציאת משלוח", bgColor: "bg-orange-100" },
    delivered: { color: "text-green-600", label: "נמסר ללקוח", bgColor: "bg-green-100" },
    cancelled: { color: "text-red-600", label: "בוטל", bgColor: "bg-red-100" },
  };
  return configs[status] || configs.pending;
}

export default function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  const { toast } = useToast();
  const [supplierNotes, setSupplierNotes] = useState(order?.supplierNotes || "");
  const [internalNotes, setInternalNotes] = useState(order?.internalNotes || "");
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || "");
  const [carrier, setCarrier] = useState(order?.carrier || "");
  const [shippingMethod, setShippingMethod] = useState(order?.shippingMethod || "");
  const [priority, setPriority] = useState(order?.priority || "normal");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    order?.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ""
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);

  // Update state when order changes
  useEffect(() => {
    if (order) {
      setSupplierNotes(order.supplierNotes || "");
      setInternalNotes(order.internalNotes || "");
      setTrackingNumber(order.trackingNumber || "");
      setCarrier(order.carrier || "");
      setShippingMethod(order.shippingMethod || "");
      setPriority(order.priority || "normal");
      setExpectedDeliveryDate(
        order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ""
      );
    }
  }, [order]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ title: "הסטטוס עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  const markShippedMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string; trackingNumber?: string }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/out-for-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trackingNumber }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ title: "המשלוח סומן כיצא לדרך" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: string }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ title: "ההערות נשמרו" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderDetailsMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      toast({ title: "הפרטים עודכנו בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const slaStatus = getSLAStatus(order);
  const priorityConfig = getPriorityConfig(order.priority);

  const handleConfirm = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "verified" });
  };

  const handleMarkOrdered = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "scheduled" });
  };

  const handleMarkShipped = () => {
    if (!trackingNumber && order.status === "scheduled") {
      toast({ 
        title: "חסר מספר מעקב", 
        description: "נא להכניס מספר מעקב לפני סימון כנשלח",
        variant: "destructive" 
      });
      return;
    }
    markShippedMutation.mutate({ orderId: order.id, trackingNumber });
  };

  const handleMarkDelivered = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "delivered" });
  };

  const handleCancel = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "cancelled" });
    setShowCancelDialog(false);
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ orderId: order.id, notes: supplierNotes });
  };

  const handleSaveDetails = () => {
    updateOrderDetailsMutation.mutate({
      orderId: order.id,
      data: {
        internalNotes,
        carrier,
        shippingMethod,
        priority,
        expectedDeliveryDate: expectedDeliveryDate || null,
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" dir="rtl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold mb-2">
                    הזמנה #{order.id.slice(0, 8)}
                  </DialogTitle>
                  <DialogDescription className="text-purple-100">
                    נוצר ב־{new Date(order.createdAt).toLocaleDateString("he-IL")} • {order.customerName}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0`}>
                    {priorityConfig.label}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0">
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* SLA Status Alert */}
            {slaStatus.status !== 'on-track' && (
              <Card className={`border-2 ${
                slaStatus.status === 'breached' 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-orange-300 bg-orange-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {slaStatus.status === 'breached' ? (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    )}
                    <div>
                      <p className={`font-bold ${
                        slaStatus.status === 'breached' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {slaStatus.status === 'breached' ? '⚠️ הזמנה באיחור!' : '⏰ דורש תשומת לב'}
                      </p>
                      <p className="text-sm text-gray-700">{slaStatus.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    פרטי לקוח
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{order.customerName}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${order.customerPhone}`} className="text-purple-600 hover:underline font-medium">
                        {order.customerPhone}
                      </a>
                    </div>
                  )}
                  {order.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${order.customerEmail}`} className="text-purple-600 hover:underline text-sm break-all">
                        {order.customerEmail}
                      </a>
                    </div>
                  )}
                  {(order.shippingAddress || order.shippingCity) && (
                    <div className="flex items-start gap-2 pt-2 border-t">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="text-sm">
                        <p className="font-semibold text-gray-700 mb-1">כתובת למשלוח:</p>
                        {order.shippingAddress && <div>{order.shippingAddress}</div>}
                        {order.shippingCity && (
                          <div className="text-gray-600">
                            {order.shippingCity}
                            {order.shippingZip && `, ${order.shippingZip}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* WhatsApp Button */}
                  {order.customerPhone && (
                    <div className="pt-3 border-t">
                      <Button
                        onClick={() => setShowWhatsAppDialog(true)}
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 ml-2" />
                        שלח הודעת WhatsApp
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    פרטי הזמנה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start gap-4">
                    {order.dealImage && (
                      <img
                        src={order.dealImage}
                        alt={order.dealName}
                        className="w-24 h-24 object-cover rounded-lg shadow-md"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-2">{order.dealName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">כמות: {order.quantity}</Badge>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          מיקום #{order.position}
                        </Badge>
                        {order.position === 1 && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                            🏆 ראשון
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">מחיר ליחידה: ₪{order.pricePaid.toLocaleString()}</p>
                      <p className="text-xl font-bold text-purple-600 mt-1">
                        סה"כ: ₪{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Context-Aware Actions */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-2 border-purple-200">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    {order.status === "pending" && "📋 אמת הזמנה"}
                    {order.status === "verified" && "📦 בחר פעולה"}
                    {order.status === "needs_coordination" && "📞 תיאום עם לקוח"}
                    {order.status === "scheduled" && "🚚 קבע משלוח"}
                    {order.status === "out_for_delivery" && "✅ אישור מסירה"}
                    {order.status === "delivered" && "🎉 ההזמנה הושלמה"}
                  </span>
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {order.status === "pending" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      💡 <strong>הצעד הבא:</strong> אמת את פרטי ההזמנה ותשלום הלקוח
                    </p>
                    <Button
                      onClick={handleConfirm}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 ml-2" />
                      ✅ אמת הזמנה והמשך
                    </Button>
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-5 w-5 ml-2" />
                      ביטול הזמנה
                    </Button>
                  </div>
                )}

                {order.status === "verified" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      💡 <strong>הצעד הבא:</strong> תאם עם הלקוח או קבע זמן משלוח
                    </p>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "needs_coordination" })}
                      variant="outline"
                      className="w-full border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    >
                      <AlertCircle className="h-5 w-5 ml-2" />
                      📞 צריך תיאום עם לקוח
                    </Button>
                    <Button
                      onClick={handleMarkOrdered}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                      size="lg"
                    >
                      <Clock className="h-5 w-5 ml-2" />
                      📅 קבע זמן משלוח
                    </Button>
                  </div>
                )}

                {order.status === "needs_coordination" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      💡 <strong>הצעד הבא:</strong> צור קשר עם הלקוח לתיאום, לאחר מכן סמן כמתואם
                    </p>
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">📞 תזכורת לתיאום:</p>
                      <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        <li>אשר עם הלקוח את כתובת המשלוח</li>
                        <li>בדוק זמינות למשלוח</li>
                        <li>הסבר על תהליך המשלוח</li>
                      </ul>
                    </div>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "verified" })}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 ml-2" />
                      ✅ תואם - המשך לקביעת משלוח
                    </Button>
                  </div>
                )}

                {order.status === "scheduled" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      💡 <strong>הצעד הבא:</strong> הכנס מספר מעקב וסמן כיצא למשלוח
                    </p>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <Label htmlFor="tracking" className="text-sm font-semibold text-blue-900 mb-2 block">
                        🚚 מספר מעקב (חובה)
                      </Label>
                      <Input
                        id="tracking"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="הכנס מספר מעקב"
                        className="text-lg font-mono"
                      />
                    </div>
                    <Button
                      onClick={handleMarkShipped}
                      disabled={!trackingNumber}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg disabled:opacity-50"
                      size="lg"
                    >
                      <Truck className="h-5 w-5 ml-2" />
                      🚚 המשלוח יצא לדרך
                    </Button>
                  </div>
                )}

                {order.status === "out_for_delivery" && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      💡 <strong>הצעד הבא:</strong> לאחר מסירת החבילה, סמן כנמסר
                    </p>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-orange-800">
                        <strong>מספר מעקב:</strong> <span className="font-mono">{order.trackingNumber || "לא צוין"}</span>
                      </p>
                    </div>
                    <Button
                      onClick={handleMarkDelivered}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 ml-2" />
                      ✅ נמסר ללקוח בהצלחה
                    </Button>
                  </div>
                )}

                {order.status === "delivered" && (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-green-700 mb-2">🎉 ההזמנה הושלמה בהצלחה!</p>
                    <p className="text-sm text-gray-600">
                      נמסר ב־{order.deliveredDate && new Date(order.deliveredDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping & Logistics */}
            {order.status !== "delivered" && (
              <Card className="border-2 border-blue-100">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    ניהול משלוח ולוגיסטיקה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority" className="text-sm font-semibold">עדיפות</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger id="priority" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">⬇️ נמוכה</SelectItem>
                          <SelectItem value="normal">➡️ רגילה</SelectItem>
                          <SelectItem value="high">⬆️ גבוהה</SelectItem>
                          <SelectItem value="urgent">🔥 דחופה!</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expectedDate" className="text-sm font-semibold">תאריך אספקה צפוי</Label>
                      <Input
                        id="expectedDate"
                        type="date"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="carrier" className="text-sm font-semibold">חברת שילוח</Label>
                    <Input
                      id="carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="לדוגמה: DHL, FedEx, ישראל דואר..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shippingMethod" className="text-sm font-semibold">שיטת משלוח</Label>
                    <Input
                      id="shippingMethod"
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      placeholder="לדוגמה: משלוח רגיל, משלוח אקספרס..."
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleSaveDetails}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    💾 שמור פרטי משלוח
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Supplier Notes */}
              <Card className="border-2 border-green-100">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardTitle className="text-sm font-semibold text-green-900">💬 הערות ללקוח (יוצג ללקוח)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    placeholder="הערות שיוצגו ללקוח (תיאום, הוראות מיוחדות...)"
                    rows={3}
                    className="resize-none mb-3"
                  />
                  <Button
                    onClick={handleSaveNotes}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    disabled={supplierNotes === order.supplierNotes}
                  >
                    שמור הערות ללקוח
                  </Button>
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card className="border-2 border-gray-200 bg-gray-50">
                <CardHeader className="bg-gray-100">
                  <CardTitle className="text-sm font-semibold text-gray-900">🔒 הערות פנימיות (לא נראות ללקוח)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="הערות פנימיות למעקב, בעיות, פרטים טכניים..."
                    rows={3}
                    className="resize-none mb-3 bg-white"
                  />
                  <Button
                    onClick={handleSaveDetails}
                    variant="outline"
                    className="w-full"
                  >
                    שמור הערות פנימיות
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            {order.events && order.events.length > 0 && (
              <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    ציר זמן ופעילות
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {order.events.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-600" />
                          {index < order.events!.length - 1 && (
                            <div className="w-0.5 flex-1 bg-purple-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-semibold text-gray-900">{event.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.createdAt).toLocaleDateString("he-IL")} • {" "}
                            {new Date(event.createdAt).toLocaleTimeString("he-IL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ביטול הזמנה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו אינה ניתנת לביטול והלקוח יקבל הודעה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              אשר ביטול הזמנה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Dialog */}
      <WhatsAppDialog
        order={order}
        open={showWhatsAppDialog}
        onOpenChange={setShowWhatsAppDialog}
      />
    </>
  );
}
