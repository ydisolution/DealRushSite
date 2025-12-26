import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Truck, MessageSquare, Flag, Package } from "lucide-react";
import { Order, isOrderOverdue, getOrderUrgency, getPriorityConfig } from "@/lib/orderHelpers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const overdue = isOrderOverdue(order);
  const urgency = getOrderUrgency(order);
  const priorityConfig = getPriorityConfig(order.priority || "normal");

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="p-3 mb-2 cursor-pointer hover:shadow-lg transition-all duration-150 border-r-4 select-none"
        style={{ 
          borderRightColor: overdue ? "#ef4444" : urgency === "urgent" ? "#f59e0b" : "#e5e7eb",
          touchAction: "none", // Prevents default touch behavior for smoother drag
        }}
        onClick={onClick}
      >
        {/* Header with Order ID and Priority */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <Badge
            className="text-xs"
            style={{
              backgroundColor: priorityConfig.bgColor,
              color: priorityConfig.color,
            }}
          >
            {priorityConfig.label}
          </Badge>
        </div>

        {/* Customer Name */}
        <h4 className="font-semibold text-sm mb-1 line-clamp-1">{order.customerName}</h4>

        {/* Deal Name */}
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{order.dealName}</p>

        {/* Details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>כמות: {order.quantity || 1}</span>
          <span>{new Date(order.createdAt).toLocaleDateString("he-IL")}</span>
        </div>

        {/* Icons Row */}
        <div className="flex items-center gap-2">
          {overdue && (
            <div title="באיחור!" className="text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          {urgency === "urgent" && !overdue && (
            <div title="דחוף" className="text-orange-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          {order.coordinationRequired === "true" && (
            <div title="טעון תיאום" className="text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </div>
          )}
          {order.trackingNumber && (
            <div title="יש מספר מעקב" className="text-green-600">
              <Truck className="h-4 w-4" />
            </div>
          )}
          {(order.priority === "high" || order.priority === "urgent") && (
            <div title="עדיפות גבוהה" className="text-purple-600">
              <Flag className="h-4 w-4" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
