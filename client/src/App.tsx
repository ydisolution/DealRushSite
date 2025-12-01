import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DealPage from "@/pages/DealPage";
import HowItWorksPageRoute from "@/pages/HowItWorksPageRoute";
import DashboardPage from "@/pages/DashboardPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AdminPage from "@/pages/AdminPage";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const handleOpenAuth = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Home onOpenAuth={handleOpenAuth} />} />
      <Route path="/deal/:id" component={() => <DealPage onOpenAuth={handleOpenAuth} />} />
      <Route path="/deals" component={() => <Home onOpenAuth={handleOpenAuth} />} />
      <Route path="/how-it-works" component={HowItWorksPageRoute} />
      <Route path="/dashboard">
        {isAuthenticated ? (
          <DashboardPage onLogout={handleLogout} />
        ) : (
          <Home onOpenAuth={handleOpenAuth} />
        )}
      </Route>
      <Route path="/checkout/:id" component={CheckoutPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  useNotifications();
  const notificationCount = isAuthenticated ? 2 : 0;

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        isLoggedIn={isAuthenticated}
        isLoading={isLoading}
        user={user}
        notificationCount={notificationCount}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
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
