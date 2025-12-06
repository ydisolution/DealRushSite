import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Store, 
  CreditCard, 
  Building, 
  Save,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

interface SupplierSettingsData {
  companyName: string;
  bankDetails: string;
  stripeAccountId: string;
}

export default function SupplierSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SupplierSettingsData>({
    queryKey: ["/api/supplier/settings"],
    enabled: !!user && user.isSupplier === "true",
  });

  const form = useForm<SupplierSettingsData>({
    defaultValues: {
      companyName: "",
      bankDetails: "",
      stripeAccountId: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SupplierSettingsData) => {
      const response = await apiRequest("POST", "/api/supplier/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "ההגדרות נשמרו בהצלחה",
        description: "פרטי התשלום שלך עודכנו",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את ההגדרות",
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    saveMutation.mutate(data);
  });

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user || user.isSupplier !== "true") {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl" dir="rtl" data-testid="supplier-settings-page">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/supplier-dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">הגדרות ספק</h1>
          <p className="text-muted-foreground mt-1">נהל את פרטי החברה והתשלום שלך</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                פרטי החברה
              </CardTitle>
              <CardDescription>
                השם יופיע בדילים שלך ובחשבוניות
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">שם החברה / העסק</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="שם העסק שלך"
                  data-testid="input-company-name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                חשבון Stripe Connect
              </CardTitle>
              <CardDescription>
                התשלומים מהדילים יועברו ישירות לחשבון ה-Stripe שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripeAccountId">Stripe Account ID</Label>
                <Input
                  id="stripeAccountId"
                  {...form.register("stripeAccountId")}
                  placeholder="acct_xxxxxxxxxx"
                  className="font-mono"
                  data-testid="input-stripe-account"
                />
                <p className="text-xs text-muted-foreground">
                  ניתן למצוא את ה-Account ID בדף ההגדרות של Stripe Connect
                </p>
              </div>
              
              {settings?.stripeAccountId ? (
                <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm">חשבון Stripe מחובר</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span className="text-sm">לא חובר חשבון Stripe - התשלומים יעוכבו</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                פרטי בנק (גיבוי)
              </CardTitle>
              <CardDescription>
                ישמש לתשלום במידה ו-Stripe לא זמין
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankDetails">פרטי חשבון בנק</Label>
                <Textarea
                  id="bankDetails"
                  {...form.register("bankDetails")}
                  placeholder="שם הבנק, מספר סניף, מספר חשבון, שם בעל החשבון"
                  rows={3}
                  data-testid="input-bank-details"
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={saveMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="h-5 w-5 ml-2" />
              {saveMutation.isPending ? "שומר..." : "שמור הגדרות"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
