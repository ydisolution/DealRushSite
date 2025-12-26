import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, type DealClosedData } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import DealSuccessCelebration from "@/components/DealSuccessCelebration";
import AIAssistantModal from "@/components/AIAssistantModal";
import { nogaAvatar } from "@/assets/nogaAvatar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DealPage from "@/pages/DealPage";
import HowItWorksPageRoute from "@/pages/HowItWorksPageRoute";
import DashboardPage from "@/pages/DashboardPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AdminPage from "@/pages/AdminPage";
import ClosingTodayPage from "@/pages/ClosingTodayPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SupplierDashboard from "@/pages/SupplierDashboard";
import SupplierSettings from "@/pages/SupplierSettings";
import SupplierCreateDeal from "@/pages/SupplierCreateDeal";
import SupplierOrders from "@/pages/SupplierOrders";
import OrdersBoard from "@/pages/OrdersBoard";
import CustomerOrders from "@/pages/CustomerOrders";
import AdminEditDeal from "@/pages/AdminEditDeal";
import RealEstatePage from "@/pages/RealEstatePage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";

function Router({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Home onOpenAuth={onOpenAuth} />} />
      <Route path="/deal/:id" component={() => <DealPage onOpenAuth={onOpenAuth} />} />
      <Route path="/deals" component={() => <Home onOpenAuth={onOpenAuth} />} />
      <Route path="/how-it-works" component={HowItWorksPageRoute} />
      <Route path="/dashboard">
        {isAuthenticated ? (
          <DashboardPage onLogout={logout} />
        ) : (
          <Home onOpenAuth={onOpenAuth} />
        )}
      </Route>
      <Route path="/checkout/:id" component={CheckoutPage} />
      <Route path="/closing-today" component={ClosingTodayPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/deals/:id/edit" component={AdminEditDeal} />
      <Route path="/supplier">
        {isAuthenticated ? <SupplierDashboard /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier-dashboard">
        {isAuthenticated ? <SupplierDashboard /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier-settings">
        {isAuthenticated ? <SupplierSettings /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier/deals/new">
        {isAuthenticated ? <SupplierCreateDeal /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier/orders">
        {isAuthenticated ? <SupplierOrders /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier/orders/board">
        {isAuthenticated ? <OrdersBoard /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/my-orders">
        {isAuthenticated ? <CustomerOrders /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/real-estate" component={RealEstatePage} />
      <Route path="/real-estate/:slug" component={ProjectDetailPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [celebrationData, setCelebrationData] = useState<DealClosedData | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDealClosed = useCallback((data: DealClosedData) => {
    setCelebrationData(data);
  }, []);

  useNotifications({ onDealClosed: handleDealClosed });
  const notificationCount = isAuthenticated ? 1 : 0;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");

    if (authStatus === "success") {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "התחברת בהצלחה!",
        description: "ברוכים הבאים",
      });
      window.history.replaceState({}, "", "/");
    } else if (authStatus === "failed") {
      toast({
        title: "שגיאה בהתחברות",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/");
    }
  }, [toast]);

  const handleOpenAuth = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Floating WhatsApp-style AI button (site-wide)
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        isLoggedIn={isAuthenticated}
        isLoading={isLoading}
        user={user}
        notificationCount={notificationCount}
        onLogin={() => handleOpenAuth("login")}
        onRegister={() => handleOpenAuth("register")}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <Router onOpenAuth={() => handleOpenAuth("login")} />
      </main>
      <Footer />

      {/* Floating Noga button and modal, always available */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          className="rounded-full shadow-lg bg-gradient-to-br from-[#7B2FF7] to-purple-600 border-2 border-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform p-0 touch-manipulation"
          aria-label="פתח שיחה עם נוגה"
          onClick={() => setAiOpen((v) => !v)}
        >
          <img src={nogaAvatar} alt="נוגה" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
        </button>
        {aiOpen && (
          <>
            {/* Backdrop for click-outside-to-close */}
            <div 
              className="fixed inset-0 bg-black/20 z-40" 
              onClick={() => setAiOpen(false)}
              aria-label="סגור שיחה"
            />
            {/* Mobile: Full screen bottom sheet, Desktop: Fixed positioned */}
            <div 
              className="fixed inset-x-0 bottom-0 md:bottom-24 md:right-6 md:left-auto w-full md:w-[400px] md:max-w-[90vw] h-[90vh] md:h-[600px] md:max-h-[80vh] rounded-t-2xl md:rounded-2xl shadow-2xl border-t md:border border-gray-200 bg-white overflow-hidden z-50"
              style={{ animation: 'slideUp 0.3s ease-out' }}
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <AIAssistantModal isOpen={true} onClose={() => setAiOpen(false)} />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      <DealSuccessCelebration
        isOpen={!!celebrationData}
        dealName={celebrationData?.dealName || ""}
        finalPrice={celebrationData?.finalPrice || 0}
        originalPrice={celebrationData?.originalPrice || Math.round(celebrationData?.finalPrice ? celebrationData.finalPrice / (1 - (celebrationData.discountPercent || 0) / 100) : 0)}
        discountPercent={celebrationData?.discountPercent || 0}
        totalUnitsSold={celebrationData?.totalUnitsSold}
        onClose={() => setCelebrationData(null)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
