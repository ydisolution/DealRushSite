import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrderCard from "./OrderCard";
import { Order } from "@/lib/orderHelpers";

interface KanbanStageProps {
  id: string;
  title: string;
  orders: Order[];
  color: string;
  icon?: React.ReactNode;
  onOrderClick: (order: Order) => void;
}

export default function KanbanStage({ id, title, orders, color, icon, onOrderClick }: KanbanStageProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full transition-all duration-150 ${isOver ? "ring-2 ring-primary bg-primary/5 scale-[1.02]" : ""}`}>
        <CardHeader className="pb-3" style={{ borderTopWidth: "4px", borderTopColor: color }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <Badge variant="secondary">{orders.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            ref={setNodeRef}
            className="space-y-2 min-h-[500px] max-h-[calc(100vh-250px)] overflow-y-auto scroll-smooth"
            style={{ 
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            }}
          >
            <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  אין הזמנות בשלב זה
                </div>
              ) : (
                orders.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))
              )}
            </SortableContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
