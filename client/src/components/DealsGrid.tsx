import DealCard, { Deal } from "./DealCard";

interface DealsGridProps {
  deals: Deal[];
  title?: string;
  onJoinDeal?: (dealId: string) => void;
  onViewDeal?: (dealId: string) => void;
}

export default function DealsGrid({ 
  deals, 
  title = "הדילים הפעילים עכשיו",
  onJoinDeal,
  onViewDeal,
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
          {deals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onJoin={onJoinDeal}
              onView={onViewDeal}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
