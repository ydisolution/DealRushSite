import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  Image as ImageIcon, 
  Package, 
  Users, 
  Calendar,
  Percent,
  DollarSign,
  Layers,
  X,
  Check,
  AlertCircle,
  CreditCard,
  Building,
  Receipt
} from "lucide-react";
import type { Deal } from "@shared/schema";
import { CATEGORIES } from "@shared/schema";

const tierSchema = z.object({
  minParticipants: z.number().min(0),
  maxParticipants: z.number().min(1),
  discount: z.number().min(0).max(100),
  price: z.number().optional(),
  commission: z.number().min(0).max(100).optional(),
});

const dealFormSchema = z.object({
  name: z.string().min(1, "שם העסקה נדרש"),
  description: z.string().optional(),
  category: z.string().min(1, "קטגוריה נדרשת"),
  originalPrice: z.number().min(1, "מחיר מקורי נדרש"),
  currentPrice: z.number().min(1, "מחיר נוכחי נדרש"),
  targetParticipants: z.number().min(1, "יעד משתתפים נדרש"),
  endTime: z.string().min(1, "תאריך סיום נדרש"),
  images: z.array(z.string()).min(1, "יש להעלות לפחות תמונה אחת"),
  tiers: z.array(tierSchema).min(1, "יש להגדיר לפחות מדרגה אחת"),
  specs: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  supplierName: z.string().optional(),
  supplierStripeKey: z.string().optional(),
  supplierBankAccount: z.string().optional(),
  platformCommission: z.number().min(0).max(100).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" dir="rtl">
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">גישה נדחתה</h1>
          <p className="text-muted-foreground mb-6">עליך להיות מחובר כדי לגשת לדף הניהול</p>
          <Button onClick={() => window.location.href = '/api/login'}>
            התחברות
          </Button>
        </div>
      </div>
    );
  }

  return <AdminContentPage />;
}

function DealForm({ 
  deal, 
  onSuccess, 
  onCancel 
}: { 
  deal?: Deal; 
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(deal?.images || []);

  const defaultTiers = deal?.tiers || [
    { minParticipants: 0, maxParticipants: 30, discount: 10, commission: 5 },
    { minParticipants: 31, maxParticipants: 60, discount: 15, commission: 5 },
    { minParticipants: 61, maxParticipants: 100, discount: 20, commission: 5 },
  ];

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      name: deal?.name || "",
      description: deal?.description || "",
      category: deal?.category || "",
      originalPrice: deal?.originalPrice || 0,
      currentPrice: deal?.currentPrice || 0,
      targetParticipants: deal?.targetParticipants || 100,
      endTime: deal?.endTime ? new Date(deal.endTime).toISOString().slice(0, 16) : "",
      images: deal?.images || [],
      tiers: defaultTiers,
      specs: deal?.specs || [],
      supplierName: deal?.supplierName || "",
      supplierStripeKey: deal?.supplierStripeKey || "",
      supplierBankAccount: deal?.supplierBankAccount || "",
      platformCommission: deal?.platformCommission || 5,
    },
  });

  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control: form.control,
    name: "specs",
  });

  const createMutation = useMutation({
    mutationFn: (data: DealFormData) => apiRequest("POST", "/api/deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "העסקה נוצרה בהצלחה" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "שגיאה ביצירת העסקה", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DealFormData) => apiRequest("PATCH", `/api/deals/${deal?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "העסקה עודכנה בהצלחה" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון העסקה", variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("images", file));

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.urls) {
        const newUrls = [...imageUrls, ...data.urls];
        setImageUrls(newUrls);
        form.setValue("images", newUrls);
      }
    } catch (error) {
      toast({ title: "שגיאה בהעלאת תמונות", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    form.setValue("images", newUrls);
  };

  const calculateTierPrice = (discount: number) => {
    const original = form.watch("originalPrice");
    return Math.round(original * (1 - discount / 100));
  };

  const onSubmit = (data: DealFormData) => {
    const formData = {
      ...data,
      tiers: data.tiers.map(tier => ({
        ...tier,
        price: calculateTierPrice(tier.discount),
      })),
    };

    if (deal) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם העסקה</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="לדוגמה: מקרר Samsung 4 דלתות"
            data-testid="input-deal-name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">קטגוריה</Label>
          <Select 
            value={form.watch("category")} 
            onValueChange={(value) => form.setValue("category", value)}
          >
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור העסקה</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="תאר את המוצר או השירות..."
          rows={3}
          data-testid="input-deal-description"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">תמונות</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url} 
                alt={`תמונה ${index + 1}`} 
                className="w-24 h-24 object-cover rounded-md border"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover-elevate">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">העלאה</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
              data-testid="input-upload-images"
            />
          </label>
        </div>
        {form.formState.errors.images && (
          <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">מחירים</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">מחיר מקורי (₪)</Label>
            <Input
              id="originalPrice"
              type="number"
              {...form.register("originalPrice", { valueAsNumber: true })}
              placeholder="8500"
              data-testid="input-original-price"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentPrice">מחיר נוכחי (₪)</Label>
            <Input
              id="currentPrice"
              type="number"
              {...form.register("currentPrice", { valueAsNumber: true })}
              placeholder="6800"
              data-testid="input-current-price"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetParticipants">יעד משתתפים</Label>
            <Input
              id="targetParticipants"
              type="number"
              {...form.register("targetParticipants", { valueAsNumber: true })}
              placeholder="100"
              data-testid="input-target-participants"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">תאריך סיום</Label>
        <Input
          id="endTime"
          type="datetime-local"
          {...form.register("endTime")}
          data-testid="input-end-time"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">מדרגות הנחה</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendTier({ minParticipants: 0, maxParticipants: 10, discount: 5, commission: 5 })}
            data-testid="button-add-tier"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף מדרגה
          </Button>
        </div>

        <div className="space-y-3">
          {tierFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-start gap-4">
                <Badge variant="secondary" className="shrink-0">
                  מדרגה {index + 1}
                </Badge>
                
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">מינימום משתתפים</Label>
                    <Input
                      type="number"
                      {...form.register(`tiers.${index}.minParticipants`, { valueAsNumber: true })}
                      data-testid={`input-tier-min-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">מקסימום משתתפים</Label>
                    <Input
                      type="number"
                      {...form.register(`tiers.${index}.maxParticipants`, { valueAsNumber: true })}
                      data-testid={`input-tier-max-${index}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">אחוז הנחה</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        {...form.register(`tiers.${index}.discount`, { valueAsNumber: true })}
                        className="pl-8"
                        data-testid={`input-tier-discount-${index}`}
                      />
                      <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">עמלה לאתר %</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        {...form.register(`tiers.${index}.commission`, { valueAsNumber: true })}
                        className="pl-8"
                        placeholder="5"
                        data-testid={`input-tier-commission-${index}`}
                      />
                      <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">מחיר מחושב</Label>
                    <div className="h-9 px-3 flex items-center bg-muted rounded-md text-sm">
                      ₪{calculateTierPrice(form.watch(`tiers.${index}.discount`) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {tierFields.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeTier(index)}
                    data-testid={`button-remove-tier-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">מפרט טכני (אופציונלי)</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSpec({ label: "", value: "" })}
            data-testid="button-add-spec"
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף שדה
          </Button>
        </div>

        {specFields.length > 0 && (
          <div className="space-y-2">
            {specFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...form.register(`specs.${index}.label`)}
                  placeholder="תווית (לדוגמה: נפח)"
                  className="flex-1"
                  data-testid={`input-spec-label-${index}`}
                />
                <Input
                  {...form.register(`specs.${index}.value`)}
                  placeholder="ערך (לדוגמה: 636 ליטר)"
                  className="flex-1"
                  data-testid={`input-spec-value-${index}`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeSpec(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">פרטי ספק וסליקה</h3>
        </div>
        
        <Card className="p-4 bg-accent/30 border-accent">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">שם הספק</Label>
              <Input
                id="supplierName"
                {...form.register("supplierName")}
                placeholder="שם החברה או העסק"
                data-testid="input-supplier-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platformCommission">עמלת פלטפורמה כללית (%)</Label>
              <div className="relative">
                <Input
                  id="platformCommission"
                  type="number"
                  {...form.register("platformCommission", { valueAsNumber: true })}
                  placeholder="5"
                  className="pl-8"
                  data-testid="input-platform-commission"
                />
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">עמלה זו תחול על כל המדרגות אם לא הוגדרה עמלה ספציפית</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierStripeKey" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                מפתח Stripe של הספק (Secret Key)
              </Label>
              <Input
                id="supplierStripeKey"
                type="password"
                {...form.register("supplierStripeKey")}
                placeholder="sk_live_..."
                data-testid="input-supplier-stripe"
              />
              <p className="text-xs text-muted-foreground">התשלום יועבר ישירות לחשבון הספק</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplierBankAccount" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                פרטי חשבון בנק (לתשלום עמלות)
              </Label>
              <Input
                id="supplierBankAccount"
                {...form.register("supplierBankAccount")}
                placeholder="מספר חשבון / IBAN"
                data-testid="input-supplier-bank"
              />
              <p className="text-xs text-muted-foreground">העמלות ישולמו לחשבון האתר בסיום הדיל</p>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          ביטול
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-deal">
          {isPending ? "שומר..." : deal ? "עדכן עסקה" : "צור עסקה"}
        </Button>
      </div>
    </form>
  );
}

function AdminContentPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "העסקה נמחקה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת העסקה", variant: "destructive" });
    },
  });

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עסקה זו?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDeal(null);
  };

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl" data-testid="admin-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">ניהול עסקאות</h1>
          <p className="text-muted-foreground mt-1">הוסף, ערוך ונהל את העסקאות באתר</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" data-testid="button-new-deal">
              <Plus className="h-5 w-5" />
              עסקה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingDeal ? "עריכת עסקה" : "יצירת עסקה חדשה"}</DialogTitle>
            </DialogHeader>
            <DealForm 
              deal={editingDeal || undefined} 
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && deals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ דילים</p>
                  <p className="text-2xl font-bold">{deals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ משתתפים</p>
                  <p className="text-2xl font-bold">{deals.reduce((sum, d) => sum + d.participants, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/30">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">עמלות משוערות</p>
                  <p className="text-2xl font-bold text-success">
                    ₪{deals.reduce((sum, d) => {
                      if (d.platformCommission && d.participants > 0) {
                        return sum + Math.round(d.currentPrice * d.participants * (d.platformCommission / 100));
                      }
                      return sum;
                    }, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין עסקאות עדיין</h3>
          <p className="text-muted-foreground mb-4">התחל על ידי יצירת העסקה הראשונה שלך</p>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-deal">
            <Plus className="h-4 w-4 ml-2" />
            צור עסקה ראשונה
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="overflow-hidden" data-testid={`admin-deal-card-${deal.id}`}>
              <div className="relative h-40 bg-muted">
                {deal.images[0] ? (
                  <img 
                    src={deal.images[0]} 
                    alt={deal.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2">
                  {getCategoryName(deal.category)}
                </Badge>
              </div>
              
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold line-clamp-1">{deal.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>₪{deal.currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{deal.participants}/{deal.targetParticipants}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(deal.endTime).toLocaleDateString("he-IL")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {deal.tiers.length} מדרגות
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    עד {Math.max(...deal.tiers.map(t => t.discount))}% הנחה
                  </Badge>
                  {deal.platformCommission && (
                    <Badge variant="secondary" className="text-xs">
                      {deal.platformCommission}% עמלה
                    </Badge>
                  )}
                </div>
                
                {deal.supplierName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    <span>ספק: {deal.supplierName}</span>
                  </div>
                )}
                
                {deal.platformCommission && deal.participants > 0 && (
                  <div className="p-2 bg-muted rounded-md text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">עמלה משוערת:</span>
                      <span className="font-semibold text-success">
                        ₪{Math.round(deal.currentPrice * deal.participants * (deal.platformCommission / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5"
                    onClick={() => handleEdit(deal)}
                    data-testid={`button-edit-deal-${deal.id}`}
                  >
                    <Edit className="h-4 w-4" />
                    ערוך
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(deal.id)}
                    data-testid={`button-delete-deal-${deal.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
