import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { calculatePositionPricing } from "@/lib/pricing";
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
  Minus,
  Wallet
} from "lucide-react";
import { SiPaypal } from "react-icons/si";

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

// Main Checkout Component - PayPal Only
export default function Checkout({ deal, onBack, onComplete }: CheckoutProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>("shipping");
  const [saveDetails, setSaveDetails] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [isPayPalProcessing, setIsPayPalProcessing] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuantity = parseInt(urlParams.get('quantity') || '1', 10);
  const [quantity, setQuantity] = useState(Math.min(Math.max(1, initialQuantity), 10));
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    needsShipping: false,
  });

  // Fetch shipping cost for selected city
  const { data: shippingCost = 0 } = useQuery({
    queryKey: [`/api/deals/${deal.id}/shipping-cost`, shippingInfo.city],
    enabled: shippingInfo.needsShipping && !!shippingInfo.city,
  });

  // Auto-fill shipping info from user data AND reset when user changes
  useEffect(() => {
    console.log('🔄 User effect triggered:', { 
      user, 
      userId: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      phone: user?.phone
    });
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const phoneNumber = user.phone || "";
      console.log('✅ Filling form with:', { 
        fullName, 
        fullNameLength: fullName.length,
        phoneNumber,
        phoneLength: phoneNumber.length
      });
      setShippingInfo({
        fullName: fullName,
        phone: phoneNumber,
        address: "",
        city: "",
        zipCode: "",
        needsShipping: false,
      });
      console.log('📝 State updated with:', {
        fullName: fullName,
        phone: phoneNumber
      });
    } else {
      console.log('🚫 No user - resetting form');
      // Reset form when user logs out
      setShippingInfo({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        needsShipping: false,
      });
      setStep("shipping");
      setOrderId(null);
      setPosition(null);
    }
  }, [user?.id]); // Only trigger when user ID changes
  
  // Debug: Log shippingInfo changes
  useEffect(() => {
    console.log('📋 ShippingInfo state changed:', shippingInfo);
  }, [shippingInfo]);
  
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

  // חישוב מחיר דינמי לפי מיקום
  const currentParticipants = deal.participants || 0;
  const nextPosition = currentParticipants + 1;
  
  // מציאת המדרגה הנוכחית
  const currentTier = deal.tiers?.find(t => 
    currentParticipants + 1 >= t.minParticipants && 
    currentParticipants + 1 <= t.maxParticipants
  );
  
  // חישוב המחיר הממוצע של המדרגה
  const tierPrice = currentTier?.price || Math.round(deal.originalPrice * (1 - (currentTier?.discount || 0) / 100));
  const dynamicPricing = calculatePositionPricing(tierPrice || deal.currentPrice);
  
  const yourPrice = dynamicPricing.firstBuyerPrice;
  const unitSavings = deal.originalPrice - yourPrice;
  const discount = Math.round((unitSavings / deal.originalPrice) * 100);
  const totalSavings = unitSavings * quantity;
  const totalPrice = yourPrice * quantity;
  const finalPrice = (totalPrice * 100) + (shippingInfo.needsShipping ? shippingCost : 0);

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

  const handleDirectPayPalRegister = async () => {
    setIsPayPalProcessing(true);
    
    try {
      const res = await fetch(`/api/deals/${deal.id}/register-without-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: shippingInfo.fullName,
          email: user?.email,
          phone: shippingInfo.phone,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "שגיאה ברישום לדיל");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${deal.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deals/${deal.id}/participants`] });
      
      const orderId = data.participant?.id ? `PP-${data.participant.id.substring(0, 8).toUpperCase()}` : `PP-${Date.now()}`;
      
      toast({
        title: "נרשמת בהצלחה!",
        description: "קישור לתשלום יישלח לאימייל שלך",
      });
      
      handlePaymentSuccess(orderId, data.participant?.position || 1);
    } catch (error: any) {
      toast({
        title: "שגיאה ברישום לדיל",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPayPalProcessing(false);
    }
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
                          placeholder="ניר כהן"
                          required
                          dir="rtl"
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
                          placeholder="050-1234567"
                          required
                          dir="ltr"
                          data-testid="input-phone"
                        />
                      </div>
                    </div>
                    
                    {/* Shipping option */}
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                      <Checkbox 
                        id="needsShipping" 
                        checked={shippingInfo.needsShipping}
                        onCheckedChange={(checked) => setShippingInfo(prev => ({ 
                          ...prev, 
                          needsShipping: checked as boolean,
                          // Reset shipping fields if unchecked
                          address: checked ? prev.address : "",
                          city: checked ? prev.city : "",
                          zipCode: checked ? prev.zipCode : ""
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="needsShipping" className="text-sm font-medium cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span>אני רוצה משלוח לכתובת</span>
                          </div>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {shippingInfo.needsShipping 
                            ? "עלות המשלוח תתווסף לסכום הכולל" 
                            : "איסוף עצמי ללא עלות"}
                        </p>
                      </div>
                    </div>

                    {/* Show address fields only if shipping is needed */}
                    {shippingInfo.needsShipping && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="address">כתובת למשלוח</Label>
                          <Input 
                            id="address"
                            value={shippingInfo.address}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="רחוב 123, דירה 4"
                            required={shippingInfo.needsShipping}
                            dir="rtl"
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
                              placeholder="תל אביב"
                              required={shippingInfo.needsShipping}
                              dir="rtl"
                              data-testid="input-city"
                            />
                            {shippingInfo.city && shippingCost > 0 && (
                              <p className="text-xs text-muted-foreground">
                                עלות משלוח: ₪{(shippingCost / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">מיקוד</Label>
                            <Input 
                              id="zipCode"
                              value={shippingInfo.zipCode}
                              onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                              placeholder="1234567"
                              required={shippingInfo.needsShipping}
                              dir="ltr"
                              data-testid="input-zipcode"
                            />
                          </div>
                        </div>
                      </>
                    )}

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

            {step === "payment" && (
              <Card>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">תשלום בעזרת PayPal</h2>
                      <p className="text-muted-foreground">
                        לחץ על הכפתור מתחת להרשמה לדיל. התשלום יתבצע דרך PayPal.
                      </p>
                    </div>
                    
                    <div className="border-t pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>המחיר שלך ליחידה:</span>
                          <span className="font-bold text-[#7B2FF7]">₪{yourPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-left">
                          מיקום #{nextPosition} • מחיר ממוצע: ₪{deal.currentPrice}
                        </div>
                        <div className="flex justify-between">
                          <span>כמות:</span>
                          <span>{quantity}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>סה"כ לתשלום:</span>
                          <span className="text-[#7B2FF7]">₪{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                          <p className="text-xs text-green-700">⚡ המחיר עשוי לרדת אם יצטרפו משתתפים נוספים</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("shipping")}
                        className="flex-1"
                      >
                        חזור
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDirectPayPalRegister}
                        disabled={isPayPalProcessing}
                        className="flex-1 bg-[#0070ba] hover:bg-[#005ea6]"
                      >
                        {isPayPalProcessing ? (
                          <>
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            מעבד...
                          </>
                        ) : (
                          <>
                            <SiPaypal className="ml-2 h-5 w-5" />
                            הרשמה לדיל עם PayPal
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
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
                    <span className="text-muted-foreground">המחיר שלך ליחידה</span>
                    <span className="font-bold text-[#7B2FF7]">₪{yourPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-left">
                    מיקום #{nextPosition} • ממוצע: ₪{deal.currentPrice}
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
                    {shippingInfo.needsShipping ? (
                      <span>₪{((shippingCost || 0) / 100).toFixed(2)}</span>
                    ) : (
                      <span className="text-success">איסוף עצמי</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <span className="font-semibold">סה"כ לתשלום</span>
                  <span className="text-xl font-bold text-[#7B2FF7]">₪{((finalPrice || 0) / 100).toFixed(2)}</span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-green-700 text-center">
                    ⚡ המחיר עשוי לרדת אם יצטרפו משתתפים נוספים
                  </p>
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
