import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  ShoppingCart,
  AlertCircle,
  Search,
  List,
  ArrowRight,
} from "lucide-react";
import KanbanStage from "@/components/KanbanStage";
import OrderCard from "@/components/OrderCard";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Order } from "@/lib/orderHelpers";
import { Link } from "wouter";

// Stage Configuration
const STAGES = [
  {
    id: "pending",
    title: "הזמנה חדשה",
    color: "#3b82f6",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    id: "verified",
    title: "תשלום אומת",
    color: "#10b981",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    id: "needs_coordination",
    title: "טעון תיאום",
    color: "#f59e0b",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  {
    id: "scheduled",
    title: "מתוזמן למשלוח",
    color: "#8b5cf6",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "out_for_delivery",
    title: "במשלוח",
    color: "#06b6d4",
    icon: <Truck className="h-4 w-4" />,
  },
  {
    id: "delivered",
    title: "נמסר ללקוח",
    color: "#22c55e",
    icon: <Package className="h-4 w-4" />,
  },
];

export default function OrdersBoard() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileSelectedStage, setMobileSelectedStage] = useState<string | null>(null); // For mobile stage selector

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 8 to 3 for faster activation
        delay: 0,
        tolerance: 2,
      },
    })
  );

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/suppliers/orders"],
  });

  // Update order status mutation with optimistic updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/suppliers/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return res.json();
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/suppliers/orders"] });
      
      // Snapshot previous value
      const previousOrders = queryClient.getQueryData<Order[]>(["/api/suppliers/orders"]);
      
      // Optimistically update to new value
      queryClient.setQueryData<Order[]>(["/api/suppliers/orders"], (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
        );
      });
      
      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(["/api/suppliers/orders"], context.previousOrders);
      }
      toast({
        title: "❌ שגיאה בעדכון",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({ title: "✅ סטטוס עודכן בהצלחה" });
    },
    onSettled: () => {
      // Refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
    },
  });

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const search = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.customerName.toLowerCase().includes(search) ||
        order.customerEmail?.toLowerCase().includes(search) ||
        order.customerPhone?.toLowerCase().includes(search) ||
        order.dealName.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search)
    );
  }, [orders, searchQuery]);

  // Group orders by status
  const ordersByStage = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    STAGES.forEach((stage) => {
      grouped[stage.id] = filteredOrders.filter((order) => order.status === stage.id);
    });
    return grouped;
  }, [filteredOrders]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Provide immediate visual feedback - no action needed, handled by DndContext
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as string;

    // Find the order
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Check if status changed
    if (order.status === newStatus) return;

    // Validation: Check if moving to "out_for_delivery" without tracking number
    if (newStatus === "out_for_delivery" && !order.trackingNumber) {
      toast({
        title: "❌ חסר מספר מעקב",
        description: "לא ניתן להעביר למשלוח ללא מספר מעקב. פתח את ההזמנה והוסף מספר מעקב.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-full">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/supplier/orders">
                <Button variant="ghost" size="icon" title="חזור לתצוגת טבלה">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">לוח ניהול הזמנות</h1>
                <p className="text-muted-foreground mt-1">גרור והזז כרטיסים בין שלבים לעדכון סטטוס</p>
              </div>
            </div>
            <Link href="/supplier/orders">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 ml-2" />
                תצוגת טבלה
              </Button>
            </Link>
          </div>

          {/* KPI Summary Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGES.map((stage) => {
              const count = ordersByStage[stage.id]?.length || 0;
              const isActive = count > 0;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    const firstOrder = ordersByStage[stage.id]?.[0];
                    if (firstOrder) {
                      document.getElementById(`stage-${stage.id}`)?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }
                  }}
                  className={`
                    relative overflow-hidden rounded-lg border-2 p-4 transition-all
                    ${isActive 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md hover:shadow-lg' 
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${stage.color}15` }}>
                      <div style={{ color: stage.color }}>
                        {stage.icon}
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 text-right">
                    {stage.title}
                  </div>
                  {isActive && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: stage.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל, טלפון, מוצר או מזהה"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Badge variant="outline">
            {filteredOrders.length} הזמנות
          </Badge>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען הזמנות...</div>
        ) : (
          <>
            {/* Mobile Stage Selector */}
            <div className="md:hidden mb-4 flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
              <button
                onClick={() => setMobileSelectedStage(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                  mobileSelectedStage === null
                    ? 'bg-[#7B2FF7] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                כל השלבים
              </button>
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setMobileSelectedStage(stage.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                    mobileSelectedStage === stage.id
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: mobileSelectedStage === stage.id ? stage.color : undefined
                  }}
                >
                  {stage.icon}
                  <span>{stage.title}</span>
                  <Badge variant="secondary" className="bg-white/20 text-inherit">
                    {ordersByStage[stage.id]?.length || 0}
                  </Badge>
                </button>
              ))}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={{ threshold: { x: 0.2, y: 0.2 }, acceleration: 10 }}
            >
              {/* Desktop: Horizontal board, Mobile: Vertical stacked or single stage */}
              <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
                {STAGES.map((stage) => (
                  <div key={stage.id} id={`stage-${stage.id}`}>
                    <KanbanStage
                      id={stage.id}
                      title={stage.title}
                      orders={ordersByStage[stage.id] || []}
                      color={stage.color}
                      icon={stage.icon}
                      onOrderClick={handleOrderClick}
                    />
                  </div>
                ))}
              </div>

              {/* Mobile: Show selected stage or all stages stacked */}
              <div className="md:hidden space-y-4">
                {mobileSelectedStage ? (
                  // Single stage view
                  (() => {
                    const stage = STAGES.find(s => s.id === mobileSelectedStage);
                    return stage ? (
                      <div key={stage.id} id={`stage-${stage.id}`}>
                        <KanbanStage
                          id={stage.id}
                          title={stage.title}
                          orders={ordersByStage[stage.id] || []}
                          color={stage.color}
                          icon={stage.icon}
                          onOrderClick={handleOrderClick}
                        />
                      </div>
                    ) : null;
                  })()
                ) : (
                  // All stages stacked vertically
                  STAGES.map((stage) => (
                    <div key={stage.id} id={`stage-${stage.id}`}>
                      <KanbanStage
                        id={stage.id}
                        title={stage.title}
                        orders={ordersByStage[stage.id] || []}
                        color={stage.color}
                        icon={stage.icon}
                        onOrderClick={handleOrderClick}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeOrder ? (
                  <div className="rotate-3 scale-105">
                    <OrderCard order={activeOrder} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </div>
  );
}
