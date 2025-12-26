import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Dashboard from "@/components/Dashboard";
import type { Participant, Deal } from "@shared/schema";

interface DashboardPageProps {
  onLogout?: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Participant[]>({
    queryKey: ["/api/user/purchases"],
    enabled: !!user,
  });

  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ participantId, quantity }: { participantId: string; quantity: number }) => {
      console.log('Updating quantity:', { participantId, quantity });
      const res = await fetch(`/api/participants/${participantId}/quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        let errorMessage = "שגיאה בעדכון כמות";
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "הכמות עודכנה בהצלחה",
        description: "הכמות שלך בדיל עודכנה",
      });
    },
    onError: (error: Error) => {
      const isAuthError = error.message.includes("Not authenticated") || error.message.includes("401");
      toast({
        title: isAuthError ? "נדרשת התחברות מחדש" : "שגיאה בעדכון כמות",
        description: isAuthError 
          ? "נא להתנתק ולהתחבר מחדש כדי להמשיך"
          : error.message,
        variant: "destructive",
      });
      
      if (isAuthError) {
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      }
    },
  });

  const cancelParticipationMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const res = await fetch(`/api/participants/${participantId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        let errorMessage = "שגיאה בביטול הרישום";
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "הרישום בוטל בהצלחה",
        description: "ההרשמה שלך לדיל בוטלה",
      });
    },
    onError: (error: Error) => {
      const isAuthError = error.message.includes("Not authenticated") || error.message.includes("401");
      toast({
        title: isAuthError ? "נדרשת התחברות מחדש" : "שגיאה בביטול רישום",
        description: isAuthError 
          ? "נא להתנתק ולהתחבר מחדש כדי להמשיך"
          : error.message,
        variant: "destructive",
      });
      
      if (isAuthError) {
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      }
    },
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
      <div className="container mx-auto px-4 py-8 text-center" dir="rtl">
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
      participantId: p.id,
      productName: deal?.name || "דיל",
      productImage: deal?.images?.[0] || "",
      status: isActive ? "active" as const : "completed" as const,
      yourPrice: p.pricePaid,
      currentPrice: deal?.currentPrice || p.pricePaid,
      endTime: endTime,
      savedAmount: (deal?.originalPrice || p.pricePaid) - p.pricePaid,
      completedDate: !isActive ? endTime : undefined,
      quantity: p.quantity,
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
    phone: user.phone || undefined,
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
      onUpdateQuantity={async (participantId, quantity) => {
        await updateQuantityMutation.mutateAsync({ participantId, quantity });
      }}
      onCancelParticipation={async (participantId) => {
        await cancelParticipationMutation.mutateAsync(participantId);
      }}
    />
  );
}
