import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import type { Participant, Deal } from "@shared/schema";

interface DashboardPageProps {
  onLogout?: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Participant[]>({
    queryKey: ["/api/user/purchases"],
    enabled: !!user,
  });

  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  if (authLoading || purchasesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">יש להתחבר כדי לצפות באזור האישי</p>
      </div>
    );
  }

  const dealMap = new Map(allDeals.map(d => [d.id, d]));
  
  const userDeals = purchases.map(p => {
    const deal = dealMap.get(p.dealId);
    const now = new Date();
    const endTime = deal?.endTime ? new Date(deal.endTime) : now;
    const isActive = endTime > now;
    
    return {
      id: p.dealId,
      productName: deal?.name || "דיל",
      productImage: deal?.images?.[0] || "",
      status: isActive ? "active" as const : "completed" as const,
      yourPrice: p.pricePaid,
      currentPrice: deal?.currentPrice || p.pricePaid,
      endTime: endTime,
      savedAmount: (deal?.originalPrice || p.pricePaid) - p.pricePaid,
      completedDate: !isActive ? endTime : undefined,
    };
  });

  const totalSaved = userDeals.reduce((sum, d) => sum + d.savedAmount, 0);
  const avgDiscount = userDeals.length > 0 
    ? Math.round(userDeals.reduce((sum, d) => {
        const original = d.yourPrice + d.savedAmount;
        return sum + ((d.savedAmount / original) * 100);
      }, 0) / userDeals.length)
    : 0;

  const dashboardUser = {
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "משתמש",
    email: user.email || "",
    totalSaved,
    totalOrders: purchases.length,
    avgDiscount,
  };

  const notifications = [
    { id: "welcome", message: `ברוך הבא, ${dashboardUser.name}!`, timestamp: new Date(), read: false },
  ];

  return (
    <Dashboard 
      user={dashboardUser}
      deals={userDeals}
      notifications={notifications}
      onViewDeal={(dealId) => setLocation(`/deal/${dealId}`)}
      onLogout={onLogout}
    />
  );
}
