import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router({ 
  isLoggedIn, 
  onOpenAuth,
  onLogout 
}: { 
  isLoggedIn: boolean; 
  onOpenAuth: () => void;
  onLogout: () => void;
}) {
  return (
    <Switch>
      <Route path="/" component={() => <Home onOpenAuth={onOpenAuth} />} />
      <Route path="/deal/:id" component={() => <DealPage onOpenAuth={onOpenAuth} />} />
      <Route path="/deals" component={() => <Home onOpenAuth={onOpenAuth} />} />
      <Route path="/how-it-works" component={HowItWorksPageRoute} />
      <Route path="/dashboard">
        {isLoggedIn ? (
          <DashboardPage onLogout={onLogout} />
        ) : (
          <Home onOpenAuth={onOpenAuth} />
        )}
      </Route>
      <Route path="/checkout/:id" component={CheckoutPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // todo: remove mock functionality
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notificationCount] = useState(2);

  const handleLogin = (email: string, password: string) => {
    console.log('Login:', email);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleRegister = (name: string, email: string, password: string) => {
    console.log('Register:', name, email);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header 
            isLoggedIn={isLoggedIn}
            notificationCount={isLoggedIn ? notificationCount : 0}
            onLogin={() => setShowAuthModal(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1">
            <Router 
              isLoggedIn={isLoggedIn}
              onOpenAuth={() => setShowAuthModal(true)}
              onLogout={handleLogout}
            />
          </main>
          <Footer />
        </div>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
