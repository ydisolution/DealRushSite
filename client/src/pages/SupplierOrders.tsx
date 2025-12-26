import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Download,
  AlertCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import {
  Order,
  isOrderOverdue,
  daysUntilDelivery,
  getOrderUrgency,
  exportOrdersToCSV,
  getPriorityConfig,
  getStatusBadge,
} from "@/lib/orderHelpers";

export default function SupplierOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 20;

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/suppliers/orders"],
  });

  // Bulk status update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      const res = await fetch("/api/suppliers/orders/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderIds, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
      setSelectedOrders(new Set());
      toast({ title: "ההזמנות עודכנו בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    },
  });

  // Filter and sort orders
  let filteredOrders = orders.filter(order => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (priorityFilter !== "all" && (order.priority || "normal") !== priorityFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(search) ||
        order.customerEmail?.toLowerCase().includes(search) ||
        order.customerPhone?.toLowerCase().includes(search) ||
        order.dealName.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Sort orders
  filteredOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "date") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
      comparison = aPriority - bPriority;
    } else if (sortBy === "status") {
      comparison = a.status.localeCompare(b.status);
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    verified: orders.filter(o => o.status === "verified").length,
    needs_coordination: orders.filter(o => o.status === "needs_coordination").length,
    scheduled: orders.filter(o => o.status === "scheduled").length,
    out_for_delivery: orders.filter(o => o.status === "out_for_delivery").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    overdue: orders.filter(o => isOrderOverdue(o)).length,
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const handleBulkAction = (status: string) => {
    if (selectedOrders.size === 0) {
      toast({ title: "לא נבחרו הזמנות", variant: "destructive" });
      return;
    }
    bulkUpdateMutation.mutate({ orderIds: Array.from(selectedOrders), status });
  };

  const handleExport = () => {
    exportOrdersToCSV(filteredOrders);
    toast({ title: "הקובץ יוצא בהצלחה" });
  };

  const statusTiles = [
    { status: "pending", label: "ממתינות", icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
    { status: "verified", label: "אומתו", icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { status: "needs_coordination", label: "טעון תיאום", icon: MessageSquare, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
    { status: "scheduled", label: "תוזמנו", icon: Package, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { status: "out_for_delivery", label: "נשלחו", icon: Truck, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    { status: "delivered", label: "נמסרו", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
    { status: "overdue", label: "באיחור", icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F9] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-4xl font-extrabold text-[#111]">מערכת ניהול הזמנות CRM</h1>
              <p className="text-[#777] mt-1">מעקב מלא אחרי הזמנות, משלוחים וטיפול בלקוחות</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/supplier/orders/board">
              <Button variant="outline" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                תצוגת לוח
              </Button>
            </Link>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              ייצוא ל-CSV
            </Button>
          </div>
        </div>

        {/* Status Summary Tiles */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {statusTiles.map((tile) => {
            const Icon = tile.icon;
            const count = statusCounts[tile.status as keyof typeof statusCounts];
            const isActive = statusFilter === tile.status;
            
            return (
              <button
                key={tile.status}
                onClick={() => setStatusFilter(tile.status)}
                className={`
                  text-right p-4 rounded-2xl border-2 transition-all
                  ${isActive 
                    ? 'border-[#7B2FF7] bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' 
                    : `${tile.borderColor} ${tile.bgColor} hover:shadow-md`
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-[#7B2FF7]' : tile.color}`} />
                </div>
                <div className="text-2xl font-extrabold text-[#111] mb-1">{count}</div>
                <div className={`text-xs font-semibold ${isActive ? 'text-[#7B2FF7]' : tile.color}`}>
                  {tile.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#111]">
                    {selectedOrders.size} הזמנות נבחרו
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-[#7B2FF7] hover:bg-[#6821e8]">
                        פעולות קבוצתיות
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkAction("verified")}>
                        אמת הכל
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction("needs_coordination")}>
                        סמן כטעון תיאום
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction("scheduled")}>
                        סמן כתוזמן
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction("out_for_delivery")}>
                        סמן כנשלח
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction("delivered")}>
                        סמן כנמסר
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                >
                  בטל בחירה
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Table */}
        <Card className="border-0 shadow-xl rounded-3xl">
          <CardContent className="p-6">
            {/* Filter Row */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#777]" />
                <Input
                  placeholder="חיפוש לפי שם, אימייל, טלפון, מזהה..."
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
                  <SelectItem value="needs_coordination">טעון תיאום</SelectItem>
                  <SelectItem value="scheduled">תוזמנו</SelectItem>
                  <SelectItem value="out_for_delivery">נשלחו</SelectItem>
                  <SelectItem value="delivered">נמסרו</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48 h-12 rounded-xl border-2">
                  <SelectValue placeholder="כל העדיפויות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העדיפויות</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                  <SelectItem value="high">גבוה</SelectItem>
                  <SelectItem value="normal">רגיל</SelectItem>
                  <SelectItem value="low">נמוך</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-48 h-12 rounded-xl border-2">
                  <SelectValue placeholder="מיין לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">תאריך</SelectItem>
                  <SelectItem value="priority">עדיפות</SelectItem>
                  <SelectItem value="status">סטטוס</SelectItem>
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
              <>
              <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="text-right w-12">
                        <Checkbox
                          checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-right font-bold text-[#111]">אינדיקטורים</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">לקוח</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">מוצר</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">כמות</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">מיקום</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">סכום</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">עדיפות</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">סטטוס</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">משלוח צפוי</TableHead>
                      <TableHead className="text-right font-bold text-[#111]">תאריך</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => {
                      const isOverdue = isOrderOverdue(order);
                      const urgency = getOrderUrgency(order);
                      const priorityConfig = getPriorityConfig(order.priority);
                      const statusBadge = getStatusBadge(order.status);
                      const daysLeft = daysUntilDelivery(order);
                      
                      return (
                        <TableRow
                          key={order.id}
                          className={`cursor-pointer hover:bg-purple-50 transition-colors ${
                            selectedOrders.has(order.id) ? 'bg-purple-100' : ''
                          }`}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedOrders.has(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                            />
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            <div className="flex items-center gap-1">
                              {isOverdue && (
                                <div title="באיחור!">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                              {urgency === 'urgent' && !isOverdue && (
                                <div title="דחוף">
                                  <AlertCircle className="h-4 w-4 text-orange-600" />
                                </div>
                              )}
                              {order.coordinationRequired === "true" && (
                                <div title="טעון תיאום">
                                  <MessageSquare className="h-4 w-4 text-yellow-600" />
                                </div>
                              )}
                              {order.priority === 'urgent' && (
                                <div title="עדיפות גבוהה">
                                  <Flag className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            <div>
                              <div className="font-bold text-[#111]">{order.customerName}</div>
                              <div className="text-sm text-[#777]">{order.customerEmail}</div>
                              <div className="text-sm text-[#777]" dir="ltr">{order.customerPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
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
                          <TableCell onClick={() => openOrderDetails(order)} className="font-semibold text-[#111]">
                            {order.quantity}
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-purple-600">#{order.position}</span>
                              {order.position === 1 && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                                  ראשון
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)} className="font-bold text-[#7B2FF7]">
                            ₪{order.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0`}>
                              {priorityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            <Badge className={`${statusBadge.bgColor} ${statusBadge.color} border-0`}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)}>
                            {order.expectedDeliveryDate ? (
                              <div className="text-sm">
                                <div className={isOverdue ? 'text-red-600 font-bold' : 'text-[#111]'}>
                                  {new Date(order.expectedDeliveryDate).toLocaleDateString("he-IL")}
                                </div>
                                {daysLeft !== null && (
                                  <div className={`text-xs ${
                                    isOverdue ? 'text-red-600' : 
                                    urgency === 'urgent' ? 'text-orange-600' : 
                                    'text-[#777]'
                                  }`}>
                                    {isOverdue ? `באיחור ${Math.abs(daysLeft)} ימים` : `עוד ${daysLeft} ימים`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#777]">לא הוגדר</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => openOrderDetails(order)} className="text-[#777]">
                            {new Date(order.createdAt).toLocaleDateString("he-IL")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-[#777]">
                    מציג {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} מתוך {filteredOrders.length} הזמנות
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold">
                      עמוד {currentPage} מתוך {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
