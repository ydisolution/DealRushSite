import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { ArrowRight, Plus, Trash2, Save, Send } from "lucide-react";
import { Link } from "wouter";

const tierSchema = z.object({
  minParticipants: z.number().min(0),
  maxParticipants: z.number().min(1),
  discount: z.number().min(0).max(100),
  price: z.number().optional(),
  commission: z.number().min(0).max(100).optional(),
});

const createDealSchema = z.object({
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

type CreateDealForm = z.infer<typeof createDealSchema>;

const categories = [
  { value: "electronics", label: "אלקטרוניקה" },
  { value: "electrical", label: "מוצרי חשמל" },
  { value: "furniture", label: "ריהוט" },
  { value: "fashion", label: "אופנה" },
  { value: "beauty", label: "יופי וטיפוח" },
  { value: "sports", label: "ספורט" },
  { value: "home", label: "בית וגינה" },
  { value: "food", label: "מזון" },
  { value: "apartments", label: "נדל\"ן" },
  { value: "services", label: "שירותים" },
  { value: "other", label: "אחר" },
];

export default function SupplierCreateDeal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const form = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      originalPrice: 0,
      targetParticipants: 50,
      minParticipants: 10,
      endTime: "",
      tiers: [
        { minParticipants: 0, maxParticipants: 20, discount: 10, commission: 5 },
        { minParticipants: 21, maxParticipants: 40, discount: 15, commission: 5 },
        { minParticipants: 41, maxParticipants: 50, discount: 20, commission: 5 },
      ],
      images: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateDealForm) => {
      const filteredImages = imageUrls.filter(url => url.trim() !== "");
      const payload = {
        ...data,
        images: filteredImages,
        tiers: data.tiers.map(tier => ({
          ...tier,
          price: Math.round(data.originalPrice * (1 - tier.discount / 100)),
        })),
      };
      const response = await apiRequest("POST", "/api/suppliers/deals", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/deals"] });
      toast({
        title: "הדיל נוצר בהצלחה",
        description: "הדיל נשמר כטיוטה. תוכל לשלוח אותו לאישור מאוחר יותר.",
      });
      setLocation("/supplier");
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת הדיל",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateDealForm) => {
    createMutation.mutate(data);
  };

  const addTier = () => {
    const currentTiers = form.getValues("tiers");
    const lastTier = currentTiers[currentTiers.length - 1];
    const newMin = lastTier ? lastTier.maxParticipants + 1 : 0;
    form.setValue("tiers", [
      ...currentTiers,
      { minParticipants: newMin, maxParticipants: newMin + 20, discount: 25, commission: 5 },
    ]);
  };

  const removeTier = (index: number) => {
    const currentTiers = form.getValues("tiers");
    if (currentTiers.length > 1) {
      form.setValue("tiers", currentTiers.filter((_, i) => i !== index));
    }
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/supplier">
            <Button variant="ghost" size="icon" data-testid="button-back-to-dashboard">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">יצירת דיל חדש</h1>
            <p className="text-muted-foreground mt-1">מלא את הפרטים ליצירת דיל קבוצתי חדש</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פרטי הדיל</CardTitle>
                <CardDescription>מידע בסיסי על המוצר או השירות</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם הדיל</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="לדוגמה: מזגן אינוורטר 1.5 כ״ס" 
                          data-testid="input-deal-name"
                          {...field} 
                        />
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
                      <FormLabel>תיאור</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="תאר את המוצר או השירות בפירוט..."
                          className="min-h-[100px]"
                          data-testid="input-deal-description"
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>תמונות</CardTitle>
                <CardDescription>הוסף כתובות URL של תמונות המוצר</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      data-testid={`input-image-url-${index}`}
                    />
                    {imageUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeImageUrl(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  data-testid="button-add-image"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף תמונה
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>מחירים ויעדים</CardTitle>
                <CardDescription>הגדר את המחיר המקורי ויעד המשתתפים</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            placeholder="0"
                            data-testid="input-original-price"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                        <FormLabel>מחיר עלות (₪) - אופציונלי</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0"
                            data-testid="input-cost-price"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                            placeholder="50"
                            data-testid="input-target-participants"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            placeholder="10"
                            data-testid="input-min-participants"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                      <FormLabel>תאריך סיום הדיל</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-end-time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>מדרגות מחיר</CardTitle>
                <CardDescription>הגדר את מדרגות ההנחה לפי מספר משתתפים</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch("tiers").map((tier, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">מדרגה {index + 1}</span>
                      {form.watch("tiers").length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTier(index)}
                          data-testid={`button-remove-tier-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>מינימום</Label>
                        <Input
                          type="number"
                          value={tier.minParticipants}
                          onChange={(e) => {
                            const tiers = form.getValues("tiers");
                            tiers[index].minParticipants = Number(e.target.value);
                            form.setValue("tiers", tiers);
                          }}
                          data-testid={`input-tier-min-${index}`}
                        />
                      </div>
                      <div>
                        <Label>מקסימום</Label>
                        <Input
                          type="number"
                          value={tier.maxParticipants}
                          onChange={(e) => {
                            const tiers = form.getValues("tiers");
                            tiers[index].maxParticipants = Number(e.target.value);
                            form.setValue("tiers", tiers);
                          }}
                          data-testid={`input-tier-max-${index}`}
                        />
                      </div>
                      <div>
                        <Label>הנחה (%)</Label>
                        <Input
                          type="number"
                          value={tier.discount}
                          onChange={(e) => {
                            const tiers = form.getValues("tiers");
                            tiers[index].discount = Number(e.target.value);
                            form.setValue("tiers", tiers);
                          }}
                          data-testid={`input-tier-discount-${index}`}
                        />
                      </div>
                      <div>
                        <Label>עמלה (%)</Label>
                        <Input
                          type="number"
                          value={tier.commission || 5}
                          onChange={(e) => {
                            const tiers = form.getValues("tiers");
                            tiers[index].commission = Number(e.target.value);
                            form.setValue("tiers", tiers);
                          }}
                          data-testid={`input-tier-commission-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTier}
                  data-testid="button-add-tier"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף מדרגה
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Link href="/supplier">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  ביטול
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-save-deal"
              >
                {createMutation.isPending ? (
                  "שומר..."
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    שמור כטיוטה
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
