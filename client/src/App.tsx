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
      <Route path="/supplier">
        {isAuthenticated ? <SupplierDashboard /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier-dashboard">
        {isAuthenticated ? <SupplierDashboard /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
      <Route path="/supplier-settings">
        {isAuthenticated ? <SupplierSettings /> : <Home onOpenAuth={onOpenAuth} />}
      </Route>
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
