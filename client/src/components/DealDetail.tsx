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
  Zap,
  Clock,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import CountdownTimer from "./CountdownTimer";
import FomoCountdownTimer from "./FomoCountdownTimer";
import PriceDisplay from "./PriceDisplay";
import ProgressBar from "./ProgressBar";
import TierProgress from "./TierProgress";
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
  activities: Array<{
    id: string;
    type: "join" | "price_drop";
    userName?: string;
    priceTo?: number;
    timestamp: Date;
  }>;
  onJoin?: () => void;
  onBack?: () => void;
}

export default function DealDetail({ deal, activities, onJoin, onBack }: DealDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

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

  const savings = originalPrice - currentPrice;
  const discount = Math.round((savings / originalPrice) * 100);
  const { firstBuyerPrice, lastBuyerPrice, avgPrice } = calculatePositionPricing(currentPrice);

  const getNextTierInfo = () => {
    const sortedTiers = [...tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    const currentTierIndex = sortedTiers.findIndex(t => 
      participants >= t.minParticipants && participants <= t.maxParticipants
    );
    
    if (currentTierIndex === -1 || currentTierIndex >= sortedTiers.length - 1) {
      return null;
    }
    
    const nextTier = sortedTiers[currentTierIndex + 1];
    const participantsNeeded = nextTier.minParticipants - participants;
    
    if (!nextTier.price) {
      const calculatedPrice = Math.round(originalPrice * (1 - nextTier.discount / 100));
      const priceDrop = currentPrice - calculatedPrice;
      
      return {
        participantsNeeded,
        nextDiscount: nextTier.discount,
        nextPrice: calculatedPrice,
        priceDrop,
      };
    }
    
    const priceDrop = currentPrice - nextTier.price;
    
    return {
      participantsNeeded,
      nextDiscount: nextTier.discount,
      nextPrice: nextTier.price,
      priceDrop,
    };
  };

  const nextTierInfo = getNextTierInfo();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const recentParticipants = [
    "דנה מ.",
    "יוסי א.",
    "שירה כ.",
    "אבי ל.",
    "רונית ש.",
  ];

  const tiersWithPeopleNeeded = tiers.map((tier, index) => {
    const peopleNeeded = Math.max(0, tier.minParticipants - participants);
    const isCurrentTier = participants >= tier.minParticipants && participants <= tier.maxParticipants;
    const isUnlocked = participants >= tier.minParticipants;
    return { ...tier, peopleNeeded, isCurrentTier, isUnlocked, tierNumber: index + 1 };
  }).sort((a, b) => a.minParticipants - b.minParticipants);

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
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
              <Users className="h-3.5 w-3.5 ml-1" />
              {participants} משתתפים
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="deal-title">
              {name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-right space-y-4">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">הזמן אוזל!</span>
                  </div>
                  <FomoCountdownTimer endTime={endTime} size="lg" showEndDate={true} />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-end justify-center md:justify-end gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">מחיר מקורי</p>
                      <p className="text-2xl font-bold line-through text-muted-foreground">
                        ₪{originalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge variant="destructive" className="mb-1 text-sm">
                        {discount}% הנחה
                      </Badge>
                      <p className="text-3xl font-bold text-primary">
                        ₪{currentPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-center md:text-left text-success font-medium">
                    חוסכים ₪{savings.toLocaleString()}!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mb-8">
            <Button 
              size="lg" 
              className="gap-2 text-lg px-12 py-6 shadow-lg shadow-primary/25 hover:shadow-xl"
              onClick={onJoin}
              data-testid="button-join-deal"
            >
              <TrendingDown className="h-5 w-5" />
              הצטרפו עכשיו וחסכו ₪{savings.toLocaleString()}
            </Button>
          </div>

          <div className="relative mb-10">
            <div className="max-w-lg mx-auto">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-xl">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={prevImage}
                      data-testid="button-prev-image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={nextImage}
                      data-testid="button-next-image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
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

          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 mb-8">
            <div className="flex -space-x-2 space-x-reverse">
              {recentParticipants.slice(0, 5).map((pname, idx) => (
                <Avatar key={idx} className="h-9 w-9 border-2 border-background">
                  <AvatarFallback className="text-xs bg-accent">
                    {pname.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-sm">
              <span className="font-bold text-lg">{participants}</span>
              <span className="text-muted-foreground"> אנשים כבר הצטרפו לדיל</span>
            </p>
          </div>

          <ProgressBar 
            current={participants} 
            target={targetParticipants}
            size="lg"
          />

          {nextTierInfo && nextTierInfo.participantsNeeded > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-urgent/50 bg-gradient-to-r from-urgent/10 to-warning/10 mt-6" data-testid="fomo-banner">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-urgent/20 animate-pulse">
                      <Flame className="h-6 w-6 text-urgent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">
                        עוד רק{" "}
                        <span className="text-urgent text-xl">{nextTierInfo.participantsNeeded}</span>{" "}
                        מצטרפים למדרגה הבאה!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        כשנגיע ל-{nextTierInfo.nextDiscount}% הנחה, המחיר יירד ב-₪{nextTierInfo.priceDrop.toLocaleString()} נוספים
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">מחיר הבא</p>
                      <p className="text-lg font-bold text-success">₪{nextTierInfo.nextPrice.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="mt-8 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                מדרגות הנחה - כמה אנשים צריך לכל מדרגה
              </h3>
              <div className="space-y-3">
                {tiersWithPeopleNeeded.map((tier, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      tier.isCurrentTier 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : tier.isUnlocked 
                          ? "border-success/30 bg-success/5" 
                          : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tier.isUnlocked ? "bg-success text-white" : "bg-muted"
                      }`}>
                        {tier.isUnlocked ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="font-bold">{tier.tierNumber}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{tier.discount}% הנחה</p>
                        <p className="text-sm text-muted-foreground">
                          {tier.minParticipants}-{tier.maxParticipants} משתתפים
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">
                        ₪{(tier.price || Math.round(originalPrice * (1 - tier.discount / 100))).toLocaleString()}
                      </p>
                      {!tier.isUnlocked && tier.peopleNeeded > 0 && (
                        <Badge variant="outline" className="text-xs">
                          עוד {tier.peopleNeeded} אנשים
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

          <Card className="mb-8">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">מחיר לפי מיקום הצטרפות במדרגה הנוכחית:</p>
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div className="p-3 bg-success/10 rounded-lg">
                  <span className="text-muted-foreground block">ראשון במדרגה</span>
                  <span className="font-bold text-success text-lg">₪{firstBuyerPrice.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground block">ממוצע</span>
                  <span className="font-bold text-lg">₪{avgPrice.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground block">אחרון במדרגה</span>
                  <span className="font-bold text-lg">₪{lastBuyerPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-background/50 rounded text-center">
                הראשון להצטרף לכל מדרגה מקבל 2.5% הנחה נוספת, האחרון משלם 2.5% יותר
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <Lock className="h-4 w-4 text-primary" />
              <span>המחיר נעול עבורכם</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <TrendingDown className="h-4 w-4 text-success" />
              <span>אם המחיר יורד - תשלמו פחות</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <span>החזר כספי עד 14 ימים</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 justify-center">
              <Truck className="h-4 w-4 text-primary" />
              <span>משלוח חינם</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">תיאור המוצר</TabsTrigger>
                  <TabsTrigger value="specs">מפרט טכני</TabsTrigger>
                  <TabsTrigger value="reviews">ביקורות</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-6">
                  <Card>
                    <CardContent className="p-6 prose prose-sm max-w-none">
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
                
                <TabsContent value="specs" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <dl className="space-y-3">
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
                
                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">4.8</div>
                        <div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 ${star <= 4 ? "fill-warning text-warning" : "fill-warning/30 text-warning/30"}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            מבוסס על {reviews.length || 127} ביקורות
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{review.userName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{review.userName}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-4 w-4 ${star <= review.rating ? "fill-warning text-warning" : "text-muted"}`}
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

            <div className="space-y-6">
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
