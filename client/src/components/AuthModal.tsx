import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Mail, Lock, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (email: string, password: string) => void;
  onRegister?: (name: string, email: string, password: string) => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onRegister,
  defaultTab = "login" 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // todo: remove mock functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    onLogin?.(loginForm.email, loginForm.password);
    setIsLoading(false);
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // todo: remove mock functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    onRegister?.(registerForm.name, registerForm.email, registerForm.password);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            ברוכים הבאים ל-DealRush
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">התחברות</TabsTrigger>
            <TabsTrigger value="register">הרשמה</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
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
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
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
                    placeholder="••••••••"
                    className="pr-10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    data-testid="input-login-password"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-login"
              >
                {isLoading ? "מתחבר..." : "התחברות"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm">
                שכחתי סיסמה
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">שם מלא</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-name"
                    placeholder="ישראל ישראלי"
                    className="pr-10"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    data-testid="input-register-name"
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
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    data-testid="input-register-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">סיסמה</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    className="pr-10"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    data-testid="input-register-password"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit-register"
              >
                {isLoading ? "יוצר חשבון..." : "הרשמה"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                בהרשמה אתם מסכימים לתנאי השימוש ומדיניות הפרטיות
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
