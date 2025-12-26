import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowRight, Save, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { Deal } from "@shared/schema";
import PriceSimulator from "@/components/PriceSimulator";

const tierSchema = z.object({
  minParticipants: z.number().min(0),
  maxParticipants: z.number().min(1),
  discount: z.number().min(0).max(100),
  price: z.number().optional(),
  commission: z.number().min(0).max(100).optional(),
});

const editDealSchema = z.object({
  name: z.string().min(1, "שם הדיל הוא שדה חובה"),
  description: z.string().optional(),
  category: z.string().min(1, "קטגוריה היא שדה חובה"),
  originalPrice: z.number().positive("מחיר חייב להיות חיובי"),
  costPrice: z.number().positive("מחיר עלות חייב להיות חיובי").optional(),
  targetParticipants: z.number().int().positive("יעד משתתפים חייב להיות חיובי"),
  minParticipants: z.number().int().positive("מינימום משתתפים חייב להיות חיובי").optional(),
  endTime: z.string().min(1, "תאריך סיום הוא שדה חובה"),
  tiers: z.array(tierSchema).min(1, "יש להגדיר לפחות מדרגה אחת"),
  images: z.array(z.string()).optional(),
});

type EditDealForm = z.infer<typeof editDealSchema>;

const categories = [
  { value: "electronics", label: "אלקטרוניקה" },
  { value: "electrical", label: "מוצרי חשמל" },
  { value: "furniture", label: "ריהוט" },
  { value: "fashion", label: "אופנה" },
  { value: "beauty", label: "יופי וטיפוח" },
  { value: "sports", label: "ספורט" },
  { value: "home", label: "בית וגינה" },
  { value: "food", label: "מזון" },
  { value: "other", label: "אחר" },
];

export default function AdminEditDeal() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/deals/:id/edit");
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const dealId = params?.id;

  const { data: deal, isLoading: isDealLoading } = useQuery<Deal>({
    queryKey: [`/api/deals/${dealId}`],
    enabled: !!dealId,
  });

  const form = useForm<EditDealForm>({
    resolver: zodResolver(editDealSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      originalPrice: 0,
      costPrice: 0,
      targetParticipants: 100,
      minParticipants: 10,
      endTime: "",
      tiers: [
        { minParticipants: 0, maxParticipants: 50, discount: 20, commission: 10 },
        { minParticipants: 51, maxParticipants: 100, discount: 30, commission: 10 },
      ],
      images: [],
    },
  });

  useEffect(() => {
    if (deal) {
      // ממיר תאריך ל-datetime-local format
      const endTimeLocal = new Date(deal.endTime);
      const offset = endTimeLocal.getTimezoneOffset();
      const localTime = new Date(endTimeLocal.getTime() - offset * 60000);
      const formattedTime = localTime.toISOString().slice(0, 16);

      form.reset({
        name: deal.name,
        description: deal.description || "",
        category: deal.category,
        originalPrice: deal.originalPrice,
        costPrice: deal.costPrice || 0,
        targetParticipants: deal.targetParticipants,
        minParticipants: deal.minParticipants || 10,
        endTime: formattedTime,
        tiers: deal.tiers.map(tier => ({
          minParticipants: tier.minParticipants,
          maxParticipants: tier.maxParticipants,
          discount: tier.discount,
          price: tier.price,
          commission: tier.commission || 10,
        })),
        images: deal.images || [],
      });
      setImageUrls(deal.images || []);
    }
  }, [deal, form]);

  const editMutation = useMutation({
    mutationFn: async (data: EditDealForm) => {
      const res = await apiRequest("PUT", `/api/deals/${dealId}`, {
        ...data,
        images: imageUrls,
        isActive: "true",
        status: "active",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId] });
      toast({
        title: "הדיל עודכן בהצלחה",
        description: "הדיל שלך עודכן ופורסם בהצלחה",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון הדיל",
        description: error.message || "אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditDealForm) => {
    editMutation.mutate(data);
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const addTier = () => {
    const currentTiers = form.getValues("tiers");
    const lastTier = currentTiers[currentTiers.length - 1];
    const newTier = {
      minParticipants: lastTier.maxParticipants + 1,
      maxParticipants: lastTier.maxParticipants + 50,
      discount: Math.min(lastTier.discount + 10, 100),
      commission: 10,
    };
    form.setValue("tiers", [...currentTiers, newTier]);
  };

  const removeTier = (index: number) => {
    const currentTiers = form.getValues("tiers");
    if (currentTiers.length > 1) {
      form.setValue("tiers", currentTiers.filter((_, i) => i !== index));
    }
  };

  if (isDealLoading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">הדיל לא נמצא</p>
            <Button className="mt-4" onClick={() => setLocation("/")}>
              חזרה לדף הראשי
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">עריכת דיל</h1>
          <p className="text-muted-foreground">עדכן את פרטי הדיל</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה לדף הראשי
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הדיל</CardTitle>
              <CardDescription>עדכן את המידע הבסיסי של הדיל</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הדיל</FormLabel>
                    <FormControl>
                      <Input placeholder="לדוגמה: מחשב נייד Dell XPS 15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תיאור (אופציונלי)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="תיאור מפורט של המוצר..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קטגוריה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מחיר מקורי (₪)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מחיר עלות (₪)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יעד משתתפים</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מינימום משתתפים</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך וזמן סיום</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תמונות</CardTitle>
              <CardDescription>הוסף תמונות למוצר</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="כתובת URL של תמונה"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <Button type="button" onClick={addImageUrl}>
                  הוסף
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`תמונה ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImageUrl(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מדרגות מחיר</CardTitle>
              <CardDescription>הגדר את מדרגות המחיר לפי כמות המשתתפים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("tiers").map((tier, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">מדרגה {index + 1}</h4>
                      {form.watch("tiers").length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTier(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`tiers.${index}.minParticipants`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>משתתפים מינימום</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tiers.${index}.maxParticipants`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>משתתפים מקסימום</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tiers.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אחוז הנחה (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`tiers.${index}.commission`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>עמלה (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      מחיר סופי:{" "}
                      <span className="font-bold">
                        ₪
                        {(
                          form.watch("originalPrice") *
                          (1 - form.watch(`tiers.${index}.discount`) / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button type="button" variant="outline" onClick={addTier} className="w-full">
                הוסף מדרגה
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? (
                "שומר..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  שמור שינויים
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
            >
              ביטול
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
