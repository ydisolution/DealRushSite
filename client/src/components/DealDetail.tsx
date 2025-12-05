import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingDown, 
  Lock, 
  Truck, 
  RefreshCcw, 
  Shield,
  ChevronRight,
  ChevronLeft,
  Star,
  Check,
  Flame,
  Clock,
  Package,
  ShoppingCart
} from "lucide-react";
import { motion } from "framer-motion";
import FomoCountdownTimer from "./FomoCountdownTimer";
import ProgressBar from "./ProgressBar";
import ActivityFeed from "./ActivityFeed";
import ParticipantsList from "./ParticipantsList";
import { calculatePositionPricing } from "@/lib/pricing";

interface DealDetailProps {
  deal: {
    id: string;
    name: string;
    description: string;
    images: string[];
    originalPrice: number;
    currentPrice: number;
    participants: number;
    targetParticipants: number;
    endTime: Date;
    tiers: Array<{
      minParticipants: number;
      maxParticipants: number;
      price?: number;
      discount: number;
    }>;
    specs?: Array<{ label: string; value: string }>;
    reviews?: Array<{
      id: string;
      userName: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
  };
  totalUnitsSold?: number;
  activities: Array<{
    id: string;
    type: "join" | "price_drop";
    userName?: string;
    priceTo?: number;
    timestamp: Date;
  }>;
  onJoin?: (quantity: number) => void;
  onBack?: () => void;
}

export default function DealDetail({ deal, totalUnitsSold, activities, onJoin, onBack }: DealDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  
  const maxQuantity = 10;

  const {
    name,
    description,
    images,
    originalPrice,
    currentPrice,
    participants,
    targetParticipants,
    endTime,
    tiers,
    specs = [],
    reviews = [],
  } = deal;

  const unitsSold = totalUnitsSold !== undefined ? totalUnitsSold : 0;
  
  const sortedTiers = [...tiers].sort((a, b) => a.minParticipants - b.minParticipants);
  
  const getCurrentTierInfo = () => {
    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      if (unitsSold < tier.minParticipants) {
        return {
          currentTierIndex: i > 0 ? i - 1 : -1,
          currentTier: i > 0 ? sortedTiers[i - 1] : null,
          nextTier: tier,
          unitsNeeded: tier.minParticipants - unitsSold,
          hasDiscount: i > 0,
          currentDiscount: i > 0 ? sortedTiers[i - 1].discount : 0,
          currentPrice: i > 0 
            ? (sortedTiers[i - 1].price || Math.round(originalPrice * (1 - sortedTiers[i - 1].discount / 100)))
            : originalPrice,
        };
      }
      if (unitsSold >= tier.minParticipants && unitsSold <= tier.maxParticipants) {
        const nextTier = sortedTiers[i + 1] || null;
        return {
          currentTierIndex: i,
          currentTier: tier,
          nextTier: nextTier,
          unitsNeeded: nextTier ? nextTier.minParticipants - unitsSold : 0,
          hasDiscount: true,
          currentDiscount: tier.discount,
          currentPrice: tier.price || Math.round(originalPrice * (1 - tier.discount / 100)),
        };
      }
    }
    const lastTier = sortedTiers[sortedTiers.length - 1];
    return {
      currentTierIndex: sortedTiers.length - 1,
      currentTier: lastTier,
      nextTier: null,
      unitsNeeded: 0,
      hasDiscount: true,
      currentDiscount: lastTier.discount,
      currentPrice: lastTier.price || Math.round(originalPrice * (1 - lastTier.discount / 100)),
    };
  };

  const tierInfo = getCurrentTierInfo();
  const effectivePrice = tierInfo.hasDiscount ? tierInfo.currentPrice : originalPrice;
  const savings = originalPrice - effectivePrice;
  const discount = tierInfo.hasDiscount ? tierInfo.currentDiscount : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const tiersWithUnitsNeeded = sortedTiers.map((tier, index) => {
    const unitsNeeded = Math.max(0, tier.minParticipants - unitsSold);
    const isCurrentTier = tierInfo.currentTierIndex === index;
    const isUnlocked = unitsSold >= tier.minParticipants;
    return { ...tier, unitsNeeded, isCurrentTier, isUnlocked, tierNumber: index + 1 };
  });

  const shortDescription = description.length > 120 
    ? description.substring(0, 120) + "..." 
    : description;

  return (
    <div className="min-h-screen bg-background" data-testid="deal-detail">
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={onBack}
          data-testid="button-back"
        >
          <ChevronRight className="h-4 w-4" />
          חזרה לדילים
        </Button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="deal-title">
              {name}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {shortDescription}
            </p>
          </div>

          <div className="relative mb-6">
            <div className="max-w-md mx-auto">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
                <img 
                  src={images[currentImageIndex]} 
                  alt={name}
                  className="w-full h-full object-cover"
                  data-testid="deal-main-image"
                />
                {images.length > 1 && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={prevImage}
                      data-testid="button-prev-image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={nextImage}
                      data-testid="button-next-image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      data-testid={`thumbnail-${idx}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full md:w-auto" dir="ltr">
                  <FomoCountdownTimer endTime={endTime} size="md" showEndDate={true} />
                </div>
                
                <div className="flex items-center gap-4">
                  {discount > 0 && (
                    <Badge variant="destructive" className="text-sm px-2 py-1">
                      {discount}%
                    </Badge>
                  )}
                  <div className="text-left">
                    {discount > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">
                          ₪{originalPrice.toLocaleString()}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ₪{effectivePrice.toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">מחיר מלא</p>
                        <p className="text-2xl font-bold">
                          ₪{originalPrice.toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {savings > 0 && (
                <p className="text-center text-success font-medium mt-3">
                  חוסכים ₪{savings.toLocaleString()}!
                </p>
              )}
            </CardContent>
          </Card>

          {!tierInfo.hasDiscount && sortedTiers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-warning/50 bg-gradient-to-r from-warning/10 to-accent/10 mb-6" data-testid="no-discount-banner">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-warning/20">
                      <Package className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        עוד{" "}
                        <span className="text-warning text-xl">{tierInfo.unitsNeeded}</span>{" "}
                        יחידות להפעלת ההנחה!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        כשנגיע ל-{sortedTiers[0].minParticipants} יחידות, כולם יקבלו {sortedTiers[0].discount}% הנחה
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tierInfo.hasDiscount && tierInfo.nextTier && tierInfo.unitsNeeded > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-urgent/50 bg-gradient-to-r from-urgent/10 to-warning/10 mb-6" data-testid="fomo-banner">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-urgent/20 animate-pulse">
                      <Flame className="h-6 w-6 text-urgent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        עוד{" "}
                        <span className="text-urgent text-xl">{tierInfo.unitsNeeded}</span>{" "}
                        יחידות למדרגה הבאה!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        במדרגה הבאה: {tierInfo.nextTier.discount}% הנחה
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">מחיר הבא</p>
                      <p className="text-lg font-bold text-success">
                        ₪{(tierInfo.nextTier.price || Math.round(originalPrice * (1 - tierInfo.nextTier.discount / 100))).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">כמות יחידות</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        data-testid="button-decrease-quantity"
                      >
                        <span className="text-lg font-bold">-</span>
                      </Button>
                      <span className="text-2xl font-bold min-w-[3rem] text-center" data-testid="text-quantity">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        disabled={quantity >= maxQuantity}
                        data-testid="button-increase-quantity"
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-border hidden md:block" />
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">סה"כ לתשלום</p>
                    <div className="flex items-center gap-2">
                      {savings > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₪{(originalPrice * quantity).toLocaleString()}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                        ₪{(effectivePrice * quantity).toLocaleString()}
                      </span>
                    </div>
                    {quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        ₪{effectivePrice.toLocaleString()} ליחידה
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="gap-2 text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl w-full md:w-auto"
                  onClick={() => onJoin?.(quantity)}
                  data-testid="button-join-deal"
                >
                  <ShoppingCart className="h-5 w-5" />
                  הצטרפו לדיל
                  {savings > 0 && ` - חסכו ₪${(savings * quantity).toLocaleString()}`}
                </Button>
              </div>
              
              {quantity > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t"
                >
                  <div className="flex items-center justify-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      כל {quantity} היחידות יחויבו במחיר הסופי הנמוך ביותר!
                    </span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/50 mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">{unitsSold}</span>
              <span className="text-muted-foreground">יחידות נמכרו</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-bold">{participants}</span>
              <span className="text-muted-foreground">לקוחות</span>
            </div>
          </div>

          <ProgressBar 
            current={unitsSold} 
            target={targetParticipants}
            size="lg"
            label="יחידות"
          />

          <Card className="mt-6 mb-6">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                מדרגות הנחה - לפי כמות יחידות
              </h3>
              <div className="space-y-3">
                {tiersWithUnitsNeeded.map((tier, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      tier.isCurrentTier 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : tier.isUnlocked 
                          ? "border-success/30 bg-success/5" 
                          : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                        tier.isUnlocked ? "bg-success text-white" : "bg-muted"
                      }`}>
                        {tier.isUnlocked ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="font-bold">{tier.tierNumber}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{tier.discount}% הנחה</p>
                        <p className="text-xs text-muted-foreground">
                          {tier.minParticipants}-{tier.maxParticipants} יחידות
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">
                        ₪{(tier.price || Math.round(originalPrice * (1 - tier.discount / 100))).toLocaleString()}
                      </p>
                      {!tier.isUnlocked && tier.unitsNeeded > 0 && (
                        <Badge variant="outline" className="text-xs">
                          עוד {tier.unitsNeeded} יחידות
                        </Badge>
                      )}
                      {tier.isCurrentTier && (
                        <Badge variant="default" className="text-xs">
                          מדרגה נוכחית
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <Lock className="h-4 w-4 text-primary" />
              <span>המחיר נעול עבורכם</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <TrendingDown className="h-4 w-4 text-success" />
              <span>ירד? תשלמו פחות</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <span>החזר עד 14 ימים</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <Truck className="h-4 w-4 text-primary" />
              <span>משלוח חינם</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">תיאור המוצר</TabsTrigger>
                  <TabsTrigger value="specs">מפרט טכני</TabsTrigger>
                  <TabsTrigger value="reviews">ביקורות</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-4">
                  <Card>
                    <CardContent className="p-4 prose prose-sm max-w-none">
                      <p>{description}</p>
                      <h3>יתרונות עיקריים:</h3>
                      <ul>
                        <li>איכות פרימיום מהיצרן</li>
                        <li>אחריות יצרן מלאה</li>
                        <li>משלוח מהיר עד הבית</li>
                        <li>תמיכה טכנית מלאה</li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="specs" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <dl className="space-y-2">
                        {specs.map((spec, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <dt className="text-muted-foreground">{spec.label}</dt>
                            <dd className="font-medium">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">4.8</div>
                        <div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= 4 ? "fill-warning text-warning" : "fill-warning/30 text-warning/30"}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            מבוסס על {reviews.length || 127} ביקורות
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="border-t pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs">{review.userName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{review.userName}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${star <= review.rating ? "fill-warning text-warning" : "text-muted"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4">
              <ParticipantsList 
                dealId={deal.id} 
                originalPrice={originalPrice} 
              />
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
