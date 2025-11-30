import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DealDetail from "@/components/DealDetail";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Deal } from "@shared/schema";

interface DealPageProps {
  onOpenAuth?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="w-20 h-20 rounded-md" />
            <Skeleton className="w-20 h-20 rounded-md" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DealPage({ onOpenAuth }: DealPageProps) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: deal, isLoading, error } = useQuery<Deal>({
    queryKey: ["/api/deals", id],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !deal) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" dir="rtl">
        <h1 className="text-2xl font-bold mb-4">העסקה לא נמצאה</h1>
        <p className="text-muted-foreground mb-4">לא הצלחנו למצוא את העסקה המבוקשת</p>
        <button 
          onClick={() => setLocation('/')}
          className="text-primary hover:underline"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  const transformedDeal = {
    id: deal.id,
    name: deal.name,
    description: deal.description || "",
    images: deal.images,
    originalPrice: deal.originalPrice,
    currentPrice: deal.currentPrice,
    participants: deal.participants,
    targetParticipants: deal.targetParticipants,
    endTime: new Date(deal.endTime),
    tiers: deal.tiers.map(t => ({
      minParticipants: t.minParticipants,
      maxParticipants: t.maxParticipants,
      price: t.price || Math.round(deal.originalPrice * (1 - t.discount / 100)),
      discount: t.discount,
    })),
    specs: deal.specs || [],
    reviews: [],
  };

  const mockActivities = [
    { id: "1", type: "join" as const, userName: "רונית מ.", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
    { id: "2", type: "join" as const, userName: "יוסי א.", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "3", type: "price_drop" as const, priceTo: deal.currentPrice, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
    { id: "4", type: "join" as const, userName: "שירה כ.", timestamp: new Date(Date.now() - 12 * 60 * 1000) },
    { id: "5", type: "join" as const, userName: "אבי ל.", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
  ];

  return (
    <DealDetail 
      deal={transformedDeal}
      activities={mockActivities}
      onJoin={() => {
        onOpenAuth?.();
      }}
      onBack={() => setLocation('/')}
    />
  );
}
