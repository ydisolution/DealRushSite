import DealCard, { Deal } from "./DealCard";
import { Card, CardContent } from "@/components/ui/card";

interface DealsGridProps {
  deals: Deal[];
  title?: string;
  onJoinDeal?: (dealId: string) => void;
  onViewDeal?: (dealId: string) => void;
  isLoading?: boolean;
}

function DealCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-12 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
        <div className="h-10 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

export default function DealsGrid({ 
  deals, 
  title = "הדילים הפעילים עכשיו",
  onJoinDeal,
  onViewDeal,
  isLoading = false,
}: DealsGridProps) {
  return (
    <section className="py-12 md:py-16" data-testid="deals-grid-section">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold" data-testid="deals-grid-title">
            {title}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <DealCardSkeleton />
              <DealCardSkeleton />
              <DealCardSkeleton />
            </>
          ) : deals.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              אין דילים זמינים כרגע
            </div>
          ) : (
            deals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onJoin={onJoinDeal}
                onView={onViewDeal}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
