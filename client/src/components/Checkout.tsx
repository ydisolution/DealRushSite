import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  CreditCard, 
  Truck, 
  Lock, 
  RefreshCcw, 
  CheckCircle,
  ChevronRight,
  TrendingDown,
  Building,
  Shield,
  Flame,
  Loader2,
  Plus,
  Minus
} from "lucide-react";

interface CheckoutProps {
  deal: {
    id: string;
    name: string;
    image: string;
    originalPrice: number;
    currentPrice: number;
    endTime: Date;
    participants?: number;
    targetParticipants?: number;
    supplierName?: string | null;
    supplierStripeKey?: string | null;
    tiers?: Array<{
      minParticipants: number;
      maxParticipants: number;
      price?: number;
      discount: number;
      commission?: number;
    }>;
    platformCommission?: number | null;
  };
  onBack?: () => void;
  onComplete?: (orderId: string) => void;
}

type Step = "shipping" | "payment" | "confirmation";

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a1a",
      fontFamily: '"Rubik", "Heebo", sans-serif',
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

function PaymentForm({ 
  deal, 
  shippingInfo, 
  quantity,
  onSuccess, 
  onBack 
}: { 
  deal: CheckoutProps['deal']; 
  shippingInfo: any; 
  quantity: number;
  onSuccess: (orderId: string, position: number) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const { data: setupData, isLoading: isLoadingSetup, error: setupError, refetch: refetchSetup } = useQuery({
    queryKey: ["/api/stripe/create-setup-intent"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create setup intent");
      }
      return res.json();
    },
    retry: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "שגיאה",
        description: "מערכת התשלום לא נטענה, נסה לרענן את הדף",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "שגיאה",
        description: "לא נמצא שדה כרטיס אשראי",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingInfo.fullName,
              phone: shippingInfo.phone,
              address: {
                city: shippingInfo.city,
                line1: shippingInfo.address,
                postal_code: shippingInfo.zipCode,
                country: "IL",
              },
            },
          },
        }
      );

      if (confirmError) {
        setCardError(confirmError.message || "שגיאה באימות הכרטיס");
        setIsProcessing(false);
        return;
      }

      if (setupIntent?.payment_method) {
        const joinRes = await apiRequest("POST", `/api/deals/${deal.id}/join`, {
          name: shippingInfo.fullName,
          userId: user?.id,
          email: user?.email,
          phone: shippingInfo.phone,
          paymentMethodId: setupIntent.payment_method,
          quantity,
        });

        const joinData = await joinRes.json();

        if (!joinRes.ok) {
          throw new Error(joinData.error || "שגיאה בהצטרפות לדיל");
        }

        queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/deals", deal.id] });
        
        const orderId = `DR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        onSuccess(orderId, joinData.participant?.position || 1);
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בהצטרפות לדיל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingSetup) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-3">טוען מערכת תשלום...</span>
        </CardContent>
      </Card>
    );
  }

  if (setupError || !setupData?.clientSecret) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="font-semibold">שגיאה בטעינת מערכת התשלום</h3>
          <p className="text-sm text-muted-foreground">
            לא הצלחנו להתחבר למערכת התשלום. נסה שוב.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onBack}>
              חזרה
            </Button>
            <Button onClick={() => refetchSetup()}>
              נסה שוב
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          פרטי כרטיס אשראי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 border rounded-md bg-background">
            <Label className="mb-2 block">פרטי כרטיס</Label>
            <CardElement 
              options={cardElementOptions} 
              onChange={(e) => {
                if (e.error) {
                  setCardError(e.error.message);
                } else {
                  setCardError(null);
                }
              }}
            />
            {cardError && (
              <p className="text-destructive text-sm mt-2">{cardError}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Lock className="h-4 w-4" />
            <span>התשלום מאובטח ומוצפן. הכרטיס יחויב רק לאחר סגירת הדיל.</span>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              disabled={isProcessing}
            >
              חזרה
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gap-2"
              disabled={isProcessing || !stripe}
              data-testid="button-complete-order"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  הצטרף לדיל
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Checkout({ deal, onBack, onComplete }: CheckoutProps) {
  const [step, setStep] = useState<Step>("shipping");
  const [saveDetails, setSaveDetails] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });
  
  const maxQuantity = 10;
  
  const increaseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  useEffect(() => {
    fetch("/api/stripe/publishable-key")
      .then(res => res.json())
      .then(data => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(err => {
        console.error("Failed to load Stripe:", err);
        toast({
          title: "שגיאה",
          description: "לא ניתן לטעון את מערכת התשלום",
          variant: "destructive",
        });
      });
  }, []);

  const unitSavings = deal.originalPrice - deal.currentPrice;
  const discount = Math.round((unitSavings / deal.originalPrice) * 100);
  const totalSavings = unitSavings * quantity;
  const totalPrice = deal.currentPrice * quantity;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSuccess = (newOrderId: string, newPosition: number) => {
    setOrderId(newOrderId);
    setPosition(newPosition);
    setStep("confirmation");
    toast({
      title: "הצטרפת לדיל בהצלחה!",
      description: `המיקום שלך: ${newPosition}`,
    });
  };

  const steps = [
    { id: "shipping", label: "פרטי משלוח" },
    { id: "payment", label: "תשלום" },
    { id: "confirmation", label: "אישור" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-muted/30" data-testid="checkout">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={onBack}
          data-testid="button-back-checkout"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה
        </Button>

        <div className="flex items-center justify-center mb-8">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex 
                    ? "bg-primary text-primary-foreground" 
                    : index === currentStepIndex 
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                  index < currentStepIndex ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    פרטי משלוח
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">שם מלא</Label>
                        <Input 
                          id="fullName"
                          value={shippingInfo.fullName}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                          data-testid="input-fullname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">טלפון</Label>
                        <Input 
                          id="phone"
                          type="tel"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                          required
                          data-testid="input-phone"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">כתובת</Label>
                      <Input 
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                        required
                        data-testid="input-address"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">עיר</Label>
                        <Input 
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                          required
                          data-testid="input-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">מיקוד</Label>
                        <Input 
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                          required
                          data-testid="input-zipcode"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox 
                        id="save" 
                        checked={saveDetails}
                        onCheckedChange={(checked) => setSaveDetails(checked as boolean)}
                      />
                      <Label htmlFor="save" className="text-sm font-normal">
                        שמרו את הפרטים לפעם הבאה
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-continue-payment">
                      המשך לתשלום
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && stripePromise && (
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  deal={deal}
                  shippingInfo={shippingInfo}
                  quantity={quantity}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setStep("shipping")}
                />
              </Elements>
            )}

            {step === "payment" && !stripePromise && (
              <Card>
                <CardContent className="p-8 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mr-3">טוען מערכת תשלום...</span>
                </CardContent>
              </Card>
            )}

            {step === "confirmation" && orderId && (
              <Card className="text-center">
                <CardContent className="p-8 space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">הצטרפת לדיל בהצלחה!</h2>
                    <p className="text-muted-foreground">
                      מספר הזמנה: <span className="font-mono font-medium">{orderId}</span>
                    </p>
                    {position && (
                      <p className="text-primary font-medium mt-2">
                        המיקום שלך בדיל: {position}
                      </p>
                    )}
                  </div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-right">
                      <h3 className="font-medium mb-3">מה קורה עכשיו?</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          הדיל ימשיך לרוץ עד לסגירה
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          אם המחיר ירד, תשלם פחות
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          נשלח עדכון כשהדיל ייסגר
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          הכרטיס יחויב רק לאחר סגירת הדיל
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          המוצר יישלח תוך 3-5 ימי עסקים
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => onComplete?.(orderId)} data-testid="button-to-dashboard">
                      לפאנל שלי
                    </Button>
                    <Button variant="outline" onClick={onBack}>
                      צפה בדיל
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">סיכום הזמנה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <img 
                    src={deal.image} 
                    alt={deal.name}
                    className="w-20 h-20 object-cover rounded-md bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">{deal.name}</h3>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">כמות</span>
                    <div className="flex items-center gap-3">
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-8 w-8"
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        data-testid="button-decrease-quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold w-8 text-center" data-testid="text-quantity">{quantity}</span>
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-8 w-8"
                        onClick={increaseQuantity}
                        disabled={quantity >= maxQuantity}
                        data-testid="button-increase-quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">מחיר ליחידה</span>
                    <span>₪{deal.currentPrice.toLocaleString()}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">מחיר מקורי ({quantity} יח')</span>
                      <span className="line-through">₪{(deal.originalPrice * quantity).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-success">
                    <span>חיסכון ({discount}%)</span>
                    <span>-₪{totalSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">משלוח</span>
                    <span className="text-success">חינם</span>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <span className="font-semibold">סה"כ לתשלום</span>
                  <span className="text-xl font-bold text-primary">₪{totalPrice.toLocaleString()}</span>
                </div>

                {deal.supplierName && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ספק:</span>
                      <span className="font-medium">{deal.supplierName}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>תשלום מאובטח</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>חיוב רק לאחר סגירת הדיל</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-success" />
                    <span>אם המחיר ימשיך לרדת, תשלם פחות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-3.5 w-3.5 text-primary" />
                    <span>החזר כספי מלא עד 14 ימים</span>
                  </div>
                </div>

                {deal.participants && deal.targetParticipants && deal.tiers && deal.tiers.length > 0 && (
                  (() => {
                    const sortedTiers = [...deal.tiers].sort((a, b) => a.minParticipants - b.minParticipants);
                    const currentTierIndex = sortedTiers.findIndex(t => 
                      deal.participants! >= t.minParticipants && deal.participants! <= t.maxParticipants
                    );
                    
                    if (currentTierIndex >= 0 && currentTierIndex < sortedTiers.length - 1) {
                      const nextTier = sortedTiers[currentTierIndex + 1];
                      const participantsNeeded = nextTier.minParticipants - deal.participants!;
                      
                      if (participantsNeeded > 0) {
                        const nextPrice = nextTier.price || Math.round(deal.originalPrice * (1 - nextTier.discount / 100));
                        return (
                          <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 p-2 bg-urgent/10 rounded-md text-xs">
                              <Flame className="h-4 w-4 text-urgent" />
                              <span>
                                עוד <strong>{participantsNeeded}</strong> אנשים ל-₪{nextPrice.toLocaleString()}!
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
