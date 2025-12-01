import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
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
  useNotifications();
  const notificationCount = isAuthenticated ? 2 : 0;

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
