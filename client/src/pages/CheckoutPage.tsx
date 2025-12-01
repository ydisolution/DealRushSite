import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Checkout from "@/components/Checkout";
import { Skeleton } from "@/components/ui/skeleton";
import type { Deal } from "@shared/schema";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: [`/api/deals/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">הדיל לא נמצא</h1>
        <button 
          onClick={() => setLocation("/")}
          className="text-primary hover:underline"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  const checkoutDeal = {
    id: deal.id,
    name: deal.name,
    image: deal.images[0] || "",
    originalPrice: deal.originalPrice,
    currentPrice: deal.currentPrice,
    endTime: new Date(deal.endTime),
    participants: deal.participants,
    targetParticipants: deal.targetParticipants,
    supplierName: deal.supplierName,
    supplierStripeKey: deal.supplierStripeKey,
    tiers: deal.tiers,
    platformCommission: deal.platformCommission,
  };

  return (
    <Checkout 
      deal={checkoutDeal}
      onBack={() => setLocation(`/deal/${id}`)}
      onComplete={() => setLocation('/dashboard')}
    />
  );
}
