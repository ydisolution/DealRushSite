import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

interface FulfillmentEvent {
  id: string;
  orderId: string;
  type: string;
  message: string;
  createdAt: Date;
  createdBySupplierId: string | null;
}

interface OrderDetailsDrawerProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; label: string; bgColor: string }> = {
    pending: { color: "text-gray-600", label: "ממתינות", bgColor: "bg-gray-100" },
    verified: { color: "text-blue-600", label: "אומתו", bgColor: "bg-blue-100" },
    needs_coordination: { color: "text-yellow-600", label: "טעון תיאום", bgColor: "bg-yellow-100" },
    scheduled: { color: "text-purple-600", label: "תוזמנו", bgColor: "bg-purple-100" },
    out_for_delivery: { color: "text-orange-600", label: "נשלחו", bgColor: "bg-orange-100" },
    delivered: { color: "text-green-600", label: "נמסרו", bgColor: "bg-green-100" },
    cancelled: { color: "text-red-600", label: "בוטלו", bgColor: "bg-red-100" },
  };
  return configs[status] || configs.pending;
}

export default function OrderDetailsDrawer({ order, open, onOpenChange }: OrderDetailsDrawerProps) {
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

  const handleConfirm = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "verified" });
  };

  const handleMarkOrdered = () => {
    updateStatusMutation.mutate({ orderId: order.id, status: "scheduled" });
  };

  const handleMarkShipped = () => {
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
    if (!order) return;
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

  if (!order) return null;

  const orderStatusConfig = getStatusConfig(order.status);
  const slaStatus = getSLAStatus(order);
  const priorityConfig = getPriorityConfig(order.priority);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-2xl">הזמנה #{order.id.slice(0, 8)}</SheetTitle>
                <SheetDescription>
                  נוצר ב־{new Date(order.createdAt).toLocaleDateString("he-IL")}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0`}>
                  {priorityConfig.label}
                </Badge>
                <Badge className={`${orderStatusConfig.bgColor} ${orderStatusConfig.color} border-0`}>
                  {orderStatusConfig.label}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
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
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    )}
                    <div>
                      <p className={`font-bold ${
                        slaStatus.status === 'breached' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {slaStatus.status === 'breached' ? 'הזמנה באיחור!' : 'דורש תשומת לב'}
                      </p>
                      <p className="text-sm text-gray-700">{slaStatus.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Customer Info */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-[#7B2FF7]" />
                  פרטי לקוח
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#777]" />
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#777]" />
                    <a href={`tel:${order.customerPhone}`} className="text-[#7B2FF7] hover:underline">
                      {order.customerPhone}
                    </a>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#777]" />
                    <a href={`mailto:${order.customerEmail}`} className="text-[#7B2FF7] hover:underline">
                      {order.customerEmail}
                    </a>
                  </div>
                )}
                {(order.shippingAddress || order.shippingCity) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#777] mt-1" />
                    <div className="text-sm">
                      {order.shippingAddress && <div>{order.shippingAddress}</div>}
                      {order.shippingCity && (
                        <div>
                          {order.shippingCity}
                          {order.shippingZip && `, ${order.shippingZip}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#7B2FF7]" />
                  פרטי מוצר
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-4">
                  {order.dealImage && (
                    <img
                      src={order.dealImage}
                      alt={order.dealName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-[#111]">{order.dealName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-[#777]">כמות: {order.quantity}</p>
                      <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                        מיקום #{order.position}
                      </span>
                      {order.position === 1 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                          ראשון
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#777] mt-1">מחיר דינמי ליחידה: ₪{order.pricePaid.toLocaleString()}</p>
                    <p className="text-lg font-bold text-[#7B2FF7] mt-2">
                      סה"כ: ₪{order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions based on status */}
            <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg">פעולות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === "pending" && (
                  <>
                    <Button
                      onClick={handleConfirm}
                      className="w-full bg-[#7B2FF7] hover:bg-[#6821e8] text-white"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5 ml-2" />
                      אמת הזמנה
                    </Button>
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full"
                    >
                      בטל הזמנה
                    </Button>
                  </>
                )}

                {order.status === "verified" && (
                  <>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "needs_coordination" })}
                      variant="outline"
                      className="w-full"
                    >
                      סמן כטעון תיאום
                    </Button>
                    <Button
                      onClick={handleMarkOrdered}
                      className="w-full bg-[#7B2FF7] hover:bg-[#6821e8] text-white"
                      size="lg"
                    >
                      <Package className="h-5 w-5 ml-2" />
                      סמן כהוזמן מהספק
                    </Button>
                    <Button
                      onClick={handleMarkShipped}
                      variant="outline"
                      className="w-full"
                    >
                      <Truck className="h-5 w-5 ml-2" />
                      סמן כנשלח
                    </Button>
                  </>
                )}

                {order.status === "needs_coordination" && (
                  <>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "verified" })}
                      className="w-full bg-[#7B2FF7] hover:bg-[#6821e8] text-white"
                      size="lg"
                    >
                      תואם - סמן כאומת
                    </Button>
                    <Button
                      onClick={handleMarkOrdered}
                      variant="outline"
                      className="w-full"
                    >
                      <Package className="h-5 w-5 ml-2" />
                      סמן כהוזמן מהספק
                    </Button>
                  </>
                )}

                {order.status === "scheduled" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="tracking">מספר מעקב (אופציונלי)</Label>
                      <Input
                        id="tracking"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="הכנס מספר מעקב"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleMarkShipped}
                      className="w-full bg-[#7B2FF7] hover:bg-[#6821e8] text-white"
                      size="lg"
                    >
                      <Truck className="h-5 w-5 ml-2" />
                      סמן כנשלח
                    </Button>
                  </div>
                )}

                {order.status === "out_for_delivery" && (
                  <Button
                    onClick={handleMarkDelivered}
                    className="w-full bg-[#7B2FF7] hover:bg-[#6821e8] text-white"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 ml-2" />
                    סמן כנמסר
                  </Button>
                )}

                {order.status === "delivered" && (
                  <div className="text-center py-4 text-green-600 font-semibold">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    ההזמנה נמסרה ללקוח
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping & Logistics Management */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#7B2FF7]" />
                  ניהול משלוח ולוגיסטיקה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">עדיפות</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="normal">רגילה</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                        <SelectItem value="urgent">דחופה!</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedDate">תאריך משלוח צפוי</Label>
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
                  <Label htmlFor="carrier">חברת שילוח</Label>
                  <Input
                    id="carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="לדוגמה: DHL, FedEx, ישראל דואר..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingMethod">שיטת משלוח</Label>
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
                  className="w-full bg-[#7B2FF7] hover:bg-[#6821e8]"
                >
                  שמור פרטי משלוח
                </Button>
              </CardContent>
            </Card>

            {/* Supplier Notes (Customer-facing) */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">הערות ללקוח</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="הערות שיוצגו ללקוח (לדוגמה: פרטי תיאום, הוראות מיוחדות...)"
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSaveNotes}
                  variant="outline"
                  className="w-full"
                  disabled={supplierNotes === order.supplierNotes}
                >
                  שמור הערות ללקוח
                </Button>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card className="border-0 shadow-lg rounded-2xl bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">הערות פנימיות (לא נראות ללקוח)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="הערות פנימיות למעקב, בעיות, פרטים טכניים..."
                  rows={4}
                  className="resize-none"
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

            {/* Status Timeline */}
            {order.events && order.events.length > 0 && (
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#7B2FF7]" />
                    ציר זמן
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.events.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-[#7B2FF7]" />
                          {index < order.events!.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-semibold text-[#111]">{event.message}</p>
                          <p className="text-xs text-[#777] mt-1">
                            {new Date(event.createdAt).toLocaleDateString("he-IL")} -{" "}
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
        </SheetContent>
      </Sheet>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ביטול הזמנה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              אשר ביטול
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
