import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Zap, Menu, User, ShoppingBag, Bell, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isEmailVerified: string;
  isAdmin: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface HeaderProps {
  isLoggedIn?: boolean;
  isLoading?: boolean;
  user?: HeaderUser | null;
  notificationCount?: number;
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
}

export default function Header({ 
  isLoggedIn = false, 
  isLoading = false,
  user,
  notificationCount = 0,
  onLogin,
  onRegister,
  onLogout 
}: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "דף הבית" },
    { href: "/deals", label: "דילים פעילים" },
    { href: "/closing-today", label: "נסגרים היום" },
    { href: "/how-it-works", label: "איך זה עובד" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">DealRush</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`link-nav-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {user?.isAdmin === "true" && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon" data-testid="button-admin" title="ניהול">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    variant="destructive"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-dashboard" title="האזור שלי">
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Button variant="ghost" size="sm" data-testid="button-profile" className="gap-2 px-2">
                  {user?.profileImageUrl ? (
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} className="object-cover" />
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {user?.firstName?.[0] || user?.email?.[0] || "U"}{user?.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'המשתמש שלי'}
                  </span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="hidden sm:flex"
                data-testid="button-logout"
              >
                יציאה
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogin}
                className="hidden sm:flex"
                data-testid="button-login"
              >
                התחברות
              </Button>
              <Button 
                size="sm" 
                onClick={onRegister}
                data-testid="button-register"
              >
                הרשמה
              </Button>
            </>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">DealRush</span>
                </div>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-base font-medium transition-colors ${
                        isActive(link.href)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`link-mobile-${link.label}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {isLoggedIn ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          הדילים שלי
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          onLogout?.();
                          setMobileMenuOpen(false);
                        }}
                      >
                        יציאה
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          onLogin?.();
                          setMobileMenuOpen(false);
                        }}
                      >
                        התחברות
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          onRegister?.();
                          setMobileMenuOpen(false);
                        }}
                      >
                        הרשמה
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
