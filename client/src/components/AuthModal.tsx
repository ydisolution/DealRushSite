import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Phone, ArrowRight, Zap } from "lucide-react";
import { SiGoogle, SiFacebook } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeView, setActiveView] = useState<"login" | "register" | "forgot-password">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  
  const { login, register, forgotPassword, isLoginPending, isRegisterPending } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setError("");
  };

  useEffect(() => {
    setActiveView(defaultTab);
  }, [defaultTab, isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      toast({
        title: "התחברת בהצלחה!",
        description: "ברוכים הבאים חזרה",
      });
      resetForm();
      onClose();
    } catch (err: any) {
      const errorData = await err?.response?.json?.().catch(() => ({}));
      setError(errorData?.error || "המייל או הסיסמא שגויים");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 8) {
      setError("הסיסמא חייבת להכיל לפחות 8 תווים");
      return;
    }

    try {
      await register({ email, password, firstName, lastName, phone });
      toast({
        title: "נרשמת בהצלחה!",
        description: "נשלח אליך מייל לאימות הכתובת",
      });
      resetForm();
      onClose();
    } catch (err: any) {
      const errorData = await err?.response?.json?.().catch(() => ({}));
      setError(errorData?.error || "אירעה שגיאה בהרשמה");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await forgotPassword(email);
      toast({
        title: "נשלח מייל",
        description: "אם המייל קיים במערכת, ישלח אליו קישור לאיפוס הסיסמא",
      });
      setActiveView("login");
      resetForm();
    } catch (err: any) {
      setError("אירעה שגיאה בשליחת המייל");
    }
  };

  const { data: providers } = useQuery<{ google: boolean; facebook: boolean }>({
    queryKey: ["/api/auth/providers"],
  });

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleFacebookLogin = () => {
    window.location.href = "/api/auth/facebook";
  };

  const SocialLoginButtons = () => {
    const hasProviders = providers?.google || providers?.facebook;
    
    if (!hasProviders) {
      return null;
    }
    
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              או המשך עם
            </span>
          </div>
        </div>
        
        <div className={`grid gap-3 ${providers?.google && providers?.facebook ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {providers?.google && (
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={handleGoogleLogin}
              data-testid="button-social-google"
            >
              <SiGoogle className="h-4 w-4" />
              <span>Google</span>
            </Button>
          )}
          {providers?.facebook && (
            <Button 
              type="button"
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={handleFacebookLogin}
              data-testid="button-social-facebook"
            >
              <SiFacebook className="h-4 w-4" />
              <span>Facebook</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (activeView) {
      case "forgot-password":
        return "שחזור סיסמא";
      case "register":
        return "הרשמה ל-DealRush";
      case "login":
      default:
        return "התחברות ל-DealRush";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl" data-testid="auth-modal">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {activeView === "login" ? "התחבר לחשבון שלך" : activeView === "register" ? "צור חשבון חדש" : "שחזר את הסיסמא שלך"}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
            {error}
          </div>
        )}

        {activeView === "forgot-password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">כתובת מייל</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  required
                  data-testid="input-forgot-email"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" data-testid="button-forgot-submit">
              שלח קישור לאיפוס
            </Button>

            <button
              type="button"
              onClick={() => setActiveView("login")}
              className="text-primary hover:underline flex items-center justify-center gap-1 w-full text-sm"
              data-testid="link-back-to-login"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה להתחברות
            </button>
          </form>
        )}

        {activeView === "login" && (
          <div className="space-y-4">
            <SocialLoginButtons />
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    className="pr-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-login-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="login-password"
                    type="password"
                    placeholder="********"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-login-password"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoginPending}
                data-testid="button-submit-login"
              >
                {isLoginPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    מתחבר...
                  </>
                ) : "התחברות"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => setActiveView("forgot-password")}
                data-testid="button-forgot-password"
              >
                שכחתי סיסמה
              </Button>
            </form>
          </div>
        )}

        {activeView === "register" && (
          <div className="space-y-4">
            <SocialLoginButtons />
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="register-firstName">שם פרטי</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-firstName"
                      placeholder="ישראל"
                      className="pr-10"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      data-testid="input-register-firstName"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-lastName">שם משפחה</Label>
                  <Input 
                    id="register-lastName"
                    placeholder="ישראלי"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    data-testid="input-register-lastName"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    className="pr-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-register-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-phone">טלפון (אופציונלי)</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-phone"
                    type="tel"
                    placeholder="050-1234567"
                    className="pr-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-register-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">סיסמה (לפחות 8 תווים)</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-password"
                    type="password"
                    placeholder="********"
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-register-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirmPassword">אימות סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-confirmPassword"
                    type="password"
                    placeholder="********"
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="input-register-confirmPassword"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRegisterPending}
                data-testid="button-submit-register"
              >
                {isRegisterPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    יוצר חשבון...
                  </>
                ) : "הרשמה"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                בהרשמה אתם מסכימים לתנאי השימוש ומדיניות הפרטיות
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
