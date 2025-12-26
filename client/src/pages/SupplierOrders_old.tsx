import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  ShoppingCart,
} from "lucide-react";
import OrderDetailsDrawer from "@/components/OrderDetailsDrawer";

interface Order {
  id: string;
  participantId: string;
  dealId: string;
  supplierId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  notesFromCustomer: string | null;
  status: string;
  supplierNotes: string | null;
  scheduledDeliveryDate: Date | null;
  outForDeliveryDate: Date | null;
  deliveredDate: Date | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippingMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
  dealName: string;
  dealImage: string | null;
  quantity: number;
  pricePaid: number;
  initialPrice: number;
  position: number;
  totalAmount: number;
  events?: FulfillmentEvent[];
}

interface FulfillmentEvent {
  id: string;
  orderId: string;
  type: string;
  message: string;
  createdAt: Date;
  createdBySupplierId: string | null;
}

function getStatusBadge(status: string) {
  const configs: Record<string, { color: string; label: string; bgColor: string }> = {
    pending: { color: "text-gray-600", label: "ממתינות", bgColor: "bg-gray-100" },
    verified: { color: "text-blue-600", label: "אומתו", bgColor: "bg-blue-100" },
    scheduled: { color: "text-purple-600", label: "תוזמנו", bgColor: "bg-purple-100" },
    out_for_delivery: { color: "text-orange-600", label: "נשלחו", bgColor: "bg-orange-100" },
    delivered: { color: "text-green-600", label: "נמסרו", bgColor: "bg-green-100" },
    cancelled: { color: "text-red-600", label: "בוטלו", bgColor: "bg-red-100" },
  };

  const config = configs[status] || configs.pending;

  return (
    <Badge className={`${config.bgColor} ${config.color} border-0`}>
      {config.label}
    </Badge>
  );
}

export default function SupplierOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/suppliers/orders"],
  });

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(search) ||
        order.customerEmail?.toLowerCase().includes(search) ||
        order.customerPhone?.toLowerCase().includes(search) ||
        order.dealName.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Calculate status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    verified: orders.filter(o => o.status === "verified").length,
    scheduled: orders.filter(o => o.status === "scheduled").length,
    out_for_delivery: orders.filter(o => o.status === "out_for_delivery").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const statusTiles = [
    { status: "pending", label: "ממתינות", icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
    { status: "verified", label: "אומתו", icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { status: "scheduled", label: "תוזמנו", icon: Package, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { status: "out_for_delivery", label: "נשלחו", icon: Truck, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    { status: "delivered", label: "נמסרו", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F9] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold text-[#111]">ניהול הזמנות</h1>
            <p className="text-[#777] mt-1">עקוב אחרי כל ההזמנות שלך וכל המשלוחים</p>
          </div>
        </div>

        {/* Status Summary Tiles */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {statusTiles.map((tile) => {
            const Icon = tile.icon;
            const count = statusCounts[tile.status as keyof typeof statusCounts];
            const isActive = statusFilter === tile.status;
            
            return (
              <button
                key={tile.status}
                onClick={() => setStatusFilter(tile.status)}
                className={`
                  text-right p-6 rounded-2xl border-2 transition-all
                  ${isActive 
                    ? 'border-[#7B2FF7] bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' 
                    : `${tile.borderColor} ${tile.bgColor} hover:shadow-md`
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`h-6 w-6 ${isActive ? 'text-[#7B2FF7]' : tile.color}`} />
                </div>
                <div className="text-3xl font-extrabold text-[#111] mb-1">{count}</div>
                <div className={`text-sm font-semibold ${isActive ? 'text-[#7B2FF7]' : tile.color}`}>
                  {tile.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters and Table */}
        <Card className="border-0 shadow-xl rounded-3xl">
          <CardContent className="p-6">
            {/* Filter Row */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#777]" />
                <Input
                  placeholder="חיפוש לפי שם לקוח, אימייל או טלפון..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-12 rounded-xl border-2"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 rounded-xl border-2">
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="pending">ממתינות</SelectItem>
                  <SelectItem value="verified">אומתו</SelectItem>
                  <SelectItem value="scheduled">תוזמנו</SelectItem>
                  <SelectItem value="out_for_delivery">נשלחו</SelectItem>
                  <SelectItem value="delivered">נמסרו</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders Table */}
            {isLoading ? (
              <div className="text-center py-12 text-[#777]">טוען הזמנות...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-16 w-16 mx-auto text-[#777] mb-4" />
                <h3 className="text-xl font-bold text-[#111] mb-2">אין הזמנות</h3>
                <p className="text-[#777]">לא נמצאו הזמנות התואמות את הקריטריונים</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="text-right font-bold text-[#111]">לקוח</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">מוצר</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">כמות</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">מיקום</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">סכום</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">כתובת</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">סטטוס</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">תאריך יצירה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        onClick={() => openOrderDetails(order)}
                        className="cursor-pointer hover:bg-purple-50 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <div className="font-bold text-[#111]">{order.customerName}</div>
                            <div className="text-sm text-[#777]">{order.customerEmail}</div>
                            <div className="text-sm text-[#777]" dir="ltr">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {order.dealImage && (
                              <img
                                src={order.dealImage}
                                alt={order.dealName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <span className="font-semibold text-[#111]">{order.dealName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-[#111]">{order.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-600">#{order.position}</span>
                            {order.position === 1 && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                                ראשון
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-[#7B2FF7]">
                          ₪{order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.shippingCity ? (
                            <div className="text-sm">
                              <div className="text-[#111] truncate max-w-[200px]">
                                {order.shippingAddress}
                              </div>
                              <div className="text-[#777]">{order.shippingCity}</div>
                            </div>
                          ) : (
                            <span className="text-[#777]">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-[#777]">
                          {new Date(order.createdAt).toLocaleDateString("he-IL")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
