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
  Zap
} from "lucide-react";
import CountdownTimer from "./CountdownTimer";
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Right side - Text, description and price (RTL) */}
          <div className="space-y-6 order-1 lg:order-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="deal-title">
                {name}
              </h1>
              <p className="text-muted-foreground">{description}</p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-urgent animate-pulse" />
                  הדיל נסגר בעוד:
                </div>
                <CountdownTimer endTime={endTime} size="lg" centered />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">חנויות רגילות</p>
                  <p className="text-xl font-bold line-through text-muted-foreground">
                    ₪{originalPrice.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-primary mb-1">DealRush</p>
                  <p className="text-xl font-bold text-primary">
                    ₪{currentPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-success">חוסכים ₪{savings.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-accent/30">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">מחיר לפי מיקום הצטרפות במדרגה הנוכחית:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ראשון במדרגה:</span>
                    <span className="font-semibold text-success">₪{firstBuyerPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ממוצע:</span>
                    <span className="font-semibold">₪{avgPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">אחרון במדרגה:</span>
                    <span className="font-semibold">₪{lastBuyerPrice.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 p-2 bg-background/50 rounded">
                  הראשון להצטרף לכל מדרגה מקבל 2.5% הנחה נוספת, האחרון משלם 2.5% יותר. הממוצע נשאר ₪{avgPrice.toLocaleString()}.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="flex -space-x-2 space-x-reverse">
                {recentParticipants.slice(0, 5).map((name, idx) => (
                  <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="text-xs bg-accent">
                      {name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-sm">
                <span className="font-medium">{participants}</span>
                <span className="text-muted-foreground"> אנשים כבר הצטרפו</span>
              </p>
            </div>

            <ProgressBar 
              current={participants} 
              target={targetParticipants}
              size="lg"
            />

            {nextTierInfo && nextTierInfo.participantsNeeded > 0 && (
              <Card className="border-urgent/50 bg-gradient-to-r from-urgent/10 to-warning/10" data-testid="fomo-banner">
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
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">שתף חברים כדי להגיע למחיר הטוב יותר!</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              size="lg" 
              className="w-full gap-2 text-lg"
              onClick={onJoin}
              data-testid="button-join-deal"
            >
              <TrendingDown className="h-5 w-5" />
              הצטרפו עכשיו וחסכו ₪{savings.toLocaleString()}
            </Button>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                <span>המחיר נעול עבורכם</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-success" />
                <span>אם המחיר יורד, תשלמו פחות</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span>החזר כספי עד 14 ימים</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>משלוח חינם</span>
              </div>
            </div>
          </div>

          {/* Left side - Image gallery (RTL) */}
          <div className="space-y-4 order-2 lg:order-1">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
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
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                    data-testid="button-prev-image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                    data-testid="button-next-image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Badge 
                className="absolute top-4 left-4 gap-1.5 bg-background/90 backdrop-blur-sm text-foreground border"
              >
                <Users className="h-3.5 w-3.5" />
                {participants} קונים
              </Badge>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? "border-primary" : "border-transparent"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
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
            <TierProgress 
              tiers={tiers} 
              currentParticipants={participants}
              originalPrice={originalPrice}
            />
            <ParticipantsList 
              dealId={deal.id} 
              originalPrice={originalPrice} 
            />
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
