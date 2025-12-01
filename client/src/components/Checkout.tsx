import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  Flame
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

export default function Checkout({ deal, onBack, onComplete }: CheckoutProps) {
  const [step, setStep] = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [saveDetails, setSaveDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });

  const savings = deal.originalPrice - deal.currentPrice;
  const discount = Math.round((savings / deal.originalPrice) * 100);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // todo: remove mock functionality
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newOrderId = `DR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setOrderId(newOrderId);
    setIsProcessing(false);
    setStep("confirmation");
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

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    אמצעי תשלום
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="space-y-3">
                        <div className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer ${
                          paymentMethod === "credit" ? "border-primary bg-accent/50" : ""
                        }`}>
                          <RadioGroupItem value="credit" id="credit" />
                          <Label htmlFor="credit" className="flex-1 cursor-pointer">
                            כרטיס אשראי
                          </Label>
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer ${
                          paymentMethod === "paypal" ? "border-primary bg-accent/50" : ""
                        }`}>
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                            PayPal
                          </Label>
                        </div>
                        <div className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer ${
                          paymentMethod === "installments" ? "border-primary bg-accent/50" : ""
                        }`}>
                          <RadioGroupItem value="installments" id="installments" />
                          <Label htmlFor="installments" className="flex-1 cursor-pointer">
                            תשלומים (3-12 ללא ריבית)
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "credit" && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">מספר כרטיס</Label>
                          <Input id="cardNumber" placeholder="0000 0000 0000 0000" data-testid="input-card" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">תוקף</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input id="cvv" placeholder="123" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep("shipping")}
                      >
                        חזרה
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 gap-2"
                        disabled={isProcessing}
                        data-testid="button-complete-order"
                      >
                        {isProcessing ? (
                          "מעבד..."
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            השלם הזמנה
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
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
                    <h2 className="text-2xl font-bold mb-2">ההזמנה אושרה!</h2>
                    <p className="text-muted-foreground">
                      מספר הזמנה: <span className="font-mono font-medium">{orderId}</span>
                    </p>
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
                          המוצר יישלח תוך 3-5 ימי עסקים
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => onComplete?.(orderId)} data-testid="button-to-dashboard">
                      לפאנל שלי
                    </Button>
                    <Button variant="outline">
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
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">מחיר מקורי</span>
                    <span className="line-through">₪{deal.originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-success">
                    <span>חיסכון ({discount}%)</span>
                    <span>-₪{savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">משלוח</span>
                    <span className="text-success">חינם</span>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <span className="font-semibold">סה"כ לתשלום</span>
                  <span className="text-xl font-bold text-primary">₪{deal.currentPrice.toLocaleString()}</span>
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
                    <span>תשלום מאובטח ישירות לספק</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>המחיר נעול - זה המחיר המקסימלי</span>
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
