import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  dealName: string;
  dealImage: string | null;
  quantity: number;
  totalAmount: number;
  status: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  scheduledDeliveryDate: Date | null;
  outForDeliveryDate: Date | null;
  deliveredDate: Date | null;
  createdAt: Date;
  events?: FulfillmentEvent[];
}

interface FulfillmentEvent {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: any; label: string; icon: any }> = {
    pending: { variant: "secondary", label: "ממתין לאישור", icon: Clock },
    verified: { variant: "default", label: "אושר", icon: CheckCircle },
    scheduled: { variant: "default", label: "תוזמן", icon: Calendar },
    out_for_delivery: { variant: "default", label: "בדרך אליך", icon: Truck },
    delivered: { variant: "default", label: "נמסר", icon: CheckCircle },
    cancelled: { variant: "destructive", label: "בוטל", icon: FileText },
  };

  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function CustomerOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
  });

  const { data: orderDetails, isLoading: detailsLoading } = useQuery<Order>({
    queryKey: ["/api/user/orders", selectedOrder?.id],
    enabled: !!selectedOrder?.id && detailsOpen,
  });

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">ההזמנות שלי</h1>
          <p className="text-muted-foreground">עקוב אחרי מצב ההזמנות והמשלוחים שלך</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען הזמנות...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">אין הזמנות עדיין</h3>
              <p className="text-muted-foreground">ההזמנות שלך יופיעו כאן לאחר סגירת עסקה</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openOrderDetails(order)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {order.dealImage && (
                      <img
                        src={order.dealImage}
                        alt={order.dealName}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{order.dealName}</h3>
                          <p className="text-sm text-muted-foreground">
                            הוזמן ב-{new Date(order.createdAt).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                        <div className="text-left">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">כמות</p>
                          <p className="font-medium">{order.quantity} יחידות</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">סכום ששולם</p>
                          <p className="font-medium">₪{order.totalAmount.toLocaleString()}</p>
                        </div>
                        {order.scheduledDeliveryDate && (
                          <div>
                            <p className="text-muted-foreground">תאריך משלוח משוער</p>
                            <p className="font-medium">
                              {new Date(order.scheduledDeliveryDate).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                        )}
                      </div>

                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">מספר מעקב:</p>
                            <p className="text-sm text-blue-700" dir="ltr">{order.trackingNumber}</p>
                          </div>
                          {order.carrier && (
                            <Badge variant="outline" className="bg-white">
                              {order.carrier}
                            </Badge>
                          )}
                        </div>
                      )}

                      {order.shippingAddress && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">כתובת משלוח:</p>
                            <p className="font-medium">
                              {order.shippingAddress}, {order.shippingCity}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button variant="outline" size="sm" onClick={() => openOrderDetails(order)}>
                        פרטים נוספים
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>פרטי הזמנה</DialogTitle>
            </DialogHeader>

            {detailsLoading ? (
              <div className="py-8 text-center text-muted-foreground">טוען פרטים...</div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      סיכום הזמנה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      {orderDetails.dealImage && (
                        <img
                          src={orderDetails.dealImage}
                          alt={orderDetails.dealName}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{orderDetails.dealName}</h3>
                        <p className="text-sm text-muted-foreground">
                          הוזמן ב-{new Date(orderDetails.createdAt).toLocaleDateString("he-IL", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">כמות</p>
                        <p className="font-semibold">{orderDetails.quantity} יחידות</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">סכום ששולם</p>
                        <p className="font-semibold text-lg">₪{orderDetails.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">סטטוס</p>
                      {getStatusBadge(orderDetails.status)}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Info */}
                {orderDetails.shippingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        פרטי משלוח
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">כתובת</p>
                        <p className="font-medium">{orderDetails.shippingAddress}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">עיר</p>
                          <p className="font-medium">{orderDetails.shippingCity || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">מיקוד</p>
                          <p className="font-medium">{orderDetails.shippingZip || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tracking Info */}
                {orderDetails.trackingNumber && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        מעקב משלוח
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">מספר מעקב</p>
                        <p className="font-mono text-lg font-semibold" dir="ltr">
                          {orderDetails.trackingNumber}
                        </p>
                      </div>
                      {orderDetails.carrier && (
                        <div>
                          <p className="text-sm text-muted-foreground">חברת שילוח</p>
                          <p className="font-medium">{orderDetails.carrier}</p>
                        </div>
                      )}
                      {orderDetails.scheduledDeliveryDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">תאריך משלוח משוער</p>
                          <p className="font-medium">
                            {new Date(orderDetails.scheduledDeliveryDate).toLocaleDateString("he-IL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                {orderDetails.events && orderDetails.events.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>מעקב אחרי ההזמנה</CardTitle>
                      <CardDescription>עדכונים אחרונים על מצב ההזמנה שלך</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderDetails.events.map((event, index) => (
                          <div key={event.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                              {index < orderDetails.events!.length - 1 && (
                                <div className="w-0.5 flex-1 bg-muted mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-medium">{event.message}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.createdAt).toLocaleString("he-IL", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
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
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
