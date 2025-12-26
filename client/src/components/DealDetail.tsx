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
  ShoppingCart,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import FomoCountdownTimer from "./FomoCountdownTimer";
import ProgressBar from "./ProgressBar";
import ParticipantsList from "./ParticipantsList";
import ProductCarousel from "./ProductCarousel";
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

  // חישוב המחיר הדינמי שהמשתמש הבא ישלם
  const nextPosition = unitsSold + 1;
  const nextParticipantPricing = calculatePositionPricing(effectivePrice);
  
  const yourPrice = nextParticipantPricing.firstBuyerPrice;
  const yourSavings = originalPrice - yourPrice;

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
    <div className="min-h-screen bg-[#F7F7F9]" data-testid="deal-detail" dir="rtl">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2.5">
          <Button 
            variant="ghost" 
            className="gap-2 text-sm"
            onClick={onBack}
            data-testid="button-back"
          >
            <ChevronRight className="h-4 w-4" />
            חזרה לדילים
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hero Section - Unified Layout */}
          <Card className="mb-5 overflow-hidden border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-purple-50 relative">
            {discount > 0 && (
              <Badge 
                className="absolute top-4 right-4 text-sm px-3 py-1.5 bg-gradient-to-r from-[#7B2FF7] to-purple-600 text-white z-10 shadow-lg"
              >
                {discount}% הנחה
              </Badge>
            )}
            <CardContent className="p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-center max-w-7xl mx-auto">
                {/* Right Side - All Content */}
                <div className="space-y-5 lg:order-1">
                  {/* Title */}
                  <div className="text-right">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#111] leading-tight mb-2" data-testid="deal-title">
                      {name}
                    </h1>
                    <p className="text-base text-[#777]">
                      {description}
                    </p>
                  </div>

                  {/* Countdown Timer - Centered */}
                  <div className="flex justify-center" dir="ltr">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl border-2 border-purple-200 shadow-sm">
                      <FomoCountdownTimer endTime={endTime} size="md" showEndDate={false} />
                    </div>
                  </div>

                  {/* Pricing Info - No separate card */}
                  <div className="space-y-3 pt-4 border-t-2 border-purple-200">
                    {/* Original Price - Right aligned */}
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-sm text-[#777]">מחיר קודם:</span>
                      <span className="text-xl text-[#777] line-through">
                        ₪{originalPrice.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Average Price with Tooltip - Right aligned */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-[#111]">מחיר ממוצע</span>
                        <div className="group relative">
                          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center cursor-help">
                            <Info className="h-3.5 w-3.5 text-[#7B2FF7]" />
                          </div>
                          <div className="absolute right-0 top-7 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                            <p className="leading-relaxed text-right">
                              בכל מדרגה נקבע אחוז הנחה קבוע מהמחיר המקורי. הראשון שמצטרף מקבל מחיר נמוך יותר והאחרון מחיר גבוה יותר מהמחיר הממוצע של המדרגה.
                            </p>
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-5xl font-extrabold text-[#7B2FF7]">
                        ₪{yourPrice.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Savings */}
                    {yourSavings > 0 && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-right">
                        <p className="text-green-700 font-bold text-base">
                          💰 חיסכון של ₪{yourSavings.toLocaleString()}!
                        </p>
                        <p className="text-green-600 text-sm mt-1">
                          ⚡ המחיר עשוי לרדת עוד אם יצטרפו משתתפים נוספים
                        </p>
                      </div>
                    )}

                    {/* Inventory Progress - FOMO */}
                    <div className="pt-3 bg-orange-50/50 border-2 border-orange-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-orange-600">נותרו {targetParticipants - unitsSold} יחידות בלבד!</span>
                        <span className="text-sm text-[#777]">{unitsSold}/{targetParticipants} נמכר</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden" dir="rtl">
                        <div 
                          className="h-full bg-gradient-to-l from-orange-500 to-red-500 transition-all duration-500"
                          style={{ width: `${Math.round((unitsSold / targetParticipants) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-orange-600 mt-2 text-right flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" />
                        <span className="font-semibold">המלאי אוזל במהירות!</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Left Side - Product Carousel */}
                <div className="flex justify-center items-center lg:order-2">
                  <div className="w-full max-w-[400px]">
                    <ProductCarousel images={images} productName={name} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Box - Purchase Section */}
          <Card className="mb-5 border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-5">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#111] text-center">הצטרפו לדיל עכשיו</h3>
                
                {/* Quantity Selector */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-11 w-11 rounded-xl border-2 text-lg"
                  >
                    -
                  </Button>
                  <div className="text-center min-w-[100px]">
                    <p className="text-xs text-[#777]">כמות</p>
                    <p className="text-3xl font-bold text-[#7B2FF7]">{quantity}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="h-11 w-11 rounded-xl border-2 text-lg"
                  >
                    +
                  </Button>
                </div>

                {/* Total Price */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 text-center border-2 border-[#7B2FF7]">
                  <p className="text-sm text-[#777] mb-1">סה"כ לתשלום</p>
                  <p className="text-4xl font-extrabold text-[#7B2FF7]">
                    ₪{(yourPrice * quantity).toLocaleString()}
                  </p>
                  {savings > 0 && (
                    <p className="text-green-600 font-semibold text-base mt-1.5">
                      חוסכים ₪{(savings * quantity).toLocaleString()}!
                    </p>
                  )}
                </div>

                {/* Main CTA Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7] shadow-xl rounded-xl"
                  onClick={() => onJoin?.(quantity)}
                  data-testid="button-join-deal"
                >
                  <ShoppingCart className="h-5 w-5 ml-2" />
                  הצטרפו לדיל – חסכו ₪{(savings * quantity).toLocaleString()}
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white shadow-sm border">
                    <Lock className="h-4 w-4 text-[#7B2FF7]" />
                    <span className="text-xs font-medium">נעול עבורך</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white shadow-sm border">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium">ירד? תשלם פחות</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white shadow-sm border">
                    <RefreshCcw className="h-4 w-4 text-[#7B2FF7]" />
                    <span className="text-xs font-medium">החזר 14 יום</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white shadow-sm border">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium">משלוח חינם</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Progress & Tiers Display - Combined */}
          <Card className="mb-5 border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-br from-[#7B2FF7] to-pink-500 rounded-full">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111]">התקדמות הקבוצה</h3>
                      <p className="text-sm text-[#777]">
                        {unitsSold} / {targetParticipants} יחידות נרכשו
                        <span className="text-[#7B2FF7] font-semibold mr-1">
                          ({Math.round((unitsSold / targetParticipants) * 100)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  {tierInfo.nextTier && (
                    <div className="text-left">
                      <p className="text-xs text-[#777]">עוד למדרגה הבאה</p>
                      <p className="text-2xl font-bold text-[#7B2FF7]">{tierInfo.unitsNeeded}</p>
                    </div>
                  )}
                </div>

                {sortedTiers.map((tier, index) => {
                  const tierPrice = tier.price || Math.round(originalPrice * (1 - tier.discount / 100));
                  
                  // Determine tier status
                  let isUnlocked = false;  // Tier completed (passed)
                  let isCurrent = false;   // Tier currently being filled (purple)
                  
                  // Use maxParticipants as the goal for all tiers
                  const tierGoal = tier.maxParticipants;
                  
                  // Find which tier we're currently in
                  const currentTierIndex = sortedTiers.findIndex((t, i) => {
                    if (i === 0 && unitsSold <= t.maxParticipants) {
                      return true; // First tier, haven't exceeded maximum yet
                    }
                    return unitsSold >= t.minParticipants && unitsSold <= t.maxParticipants;
                  });
                  
                  if (index < currentTierIndex || (currentTierIndex === -1 && unitsSold >= tier.maxParticipants)) {
                    // We've passed this tier completely - GREEN
                    isUnlocked = true;
                  } else if (index === currentTierIndex) {
                    // This is the tier currently being filled - PURPLE
                    isCurrent = true;
                  }
                  // else: tier is locked (gray)
                  
                  // Calculate progress
                  let tierProgress = 0;
                  let tierProgressText = `מקסימום ${tierGoal} יחידות`;
                  
                  if (isUnlocked) {
                    // Tier completed
                    tierProgress = 100;
                  } else if (isCurrent) {
                    // Currently filling - show progress towards goal
                    tierProgress = Math.min((unitsSold / tierGoal) * 100, 100);
                  } else {
                    // Locked
                    tierProgress = 0;
                  }
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-[#7B2FF7]/15 to-pink-500/15 border-[#7B2FF7] shadow-lg' 
                          : isUnlocked 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-700 shadow-md' 
                            : 'bg-gradient-to-r from-gray-50 via-slate-50 to-purple-50/30 border-gray-300 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                          isCurrent 
                            ? 'bg-gradient-to-br from-[#7B2FF7] to-pink-500 text-white' 
                            : isUnlocked 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                              : 'bg-gradient-to-br from-gray-300 to-slate-300 text-gray-500'
                        }`}>
                          {isUnlocked ? (
                            <Check className="h-6 w-6" strokeWidth={3} />
                          ) : isCurrent ? (
                            <Users className="h-6 w-6" strokeWidth={2.5} />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        
                        {/* Tier Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-lg font-bold ${
                              isCurrent ? 'text-[#7B2FF7]' : isUnlocked ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              מדרגה {index + 1}
                            </span>
                            {isCurrent && (
                              <Badge className="bg-[#7B2FF7] text-white text-xs px-2 py-0.5">
                                ✨ אתם כאן!
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {/* Tier Details */}
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <span className={`font-semibold ${
                                isCurrent ? 'text-[#7B2FF7]' : isUnlocked ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {tier.discount}% הנחה
                              </span>
                            </div>
                            
                            {/* Progress Text */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`font-bold ${
                                  isCurrent ? 'text-[#7B2FF7]' : isUnlocked ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {tierProgressText}
                                </span>
                                {isUnlocked && (
                                  <span className="text-xs text-green-600 font-semibold">
                                    ✓ הושלם!
                                  </span>
                                )}
                                {isCurrent && unitsSold < tierGoal && (
                                  <span className="text-xs text-[#7B2FF7] font-semibold">
                                    נותרו {tierGoal - unitsSold} יחידות
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  isCurrent 
                                    ? 'bg-gradient-to-l from-[#7B2FF7] to-pink-500' 
                                    : isUnlocked 
                                      ? 'bg-gradient-to-l from-green-500 to-emerald-600' 
                                      : 'bg-transparent'
                                }`}
                                style={{ width: `${tierProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex-shrink-0 text-left">
                          <p className="text-xs text-gray-500 mb-0.5">מחיר</p>
                          <p className={`text-2xl font-bold ${
                            isCurrent ? 'text-[#7B2FF7]' : isUnlocked ? 'text-green-600' : 'text-gray-700'
                          }`}>
                            ₪{tierPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Current Indicator Line */}
                      {isCurrent && (
                        <div className="absolute inset-0 border-2 border-[#7B2FF7] rounded-xl pointer-events-none animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-3 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600" />
                    <span>הושג</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#7B2FF7] to-pink-500" />
                    <span>נוכחי</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span>נעול</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details Section */}
          <Card className="mb-5 border-0 shadow-lg rounded-2xl">
            <CardContent className="p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-gray-100">
                  <TabsTrigger value="reviews" className="rounded-lg text-sm font-semibold">ביקורות</TabsTrigger>
                  <TabsTrigger value="specs" className="rounded-lg text-sm font-semibold">מפרט</TabsTrigger>
                  <TabsTrigger value="description" className="rounded-lg text-sm font-semibold">תיאור</TabsTrigger>
                </TabsList>
                

                <TabsContent value="description" className="mt-4 space-y-3">
                  <div className="prose max-w-none text-right">
                    <p className="text-[#111] text-base leading-relaxed whitespace-pre-wrap text-right">{description}</p>
                  </div>
                  
                  {/* Why Join This Deal Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mt-4 border-2 border-purple-200 text-right">
                    <h4 className="text-lg font-bold text-[#111] mb-3 flex items-center justify-end gap-2">
                      למה להצטרף לדיל הזה?
                      <Star className="h-5 w-5 text-[#7B2FF7]" />
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2.5 justify-end">
                        <span className="text-[#111] text-sm text-right">משלוח חינם לכל הארץ</span>
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      </li>
                      <li className="flex items-start gap-2.5 justify-end">
                        <span className="text-[#111] text-sm text-right">החזר כספי מלא עד 14 יום</span>
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      </li>
                      <li className="flex items-start gap-2.5 justify-end">
                        <span className="text-[#111] text-sm text-right">אחריות יצרן מלאה</span>
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      </li>
                      <li className="flex items-start gap-2.5 justify-end">
                        <span className="text-[#111] text-sm text-right">משלמים פחות ככל שמצטרפים יותר</span>
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      </li>
                      <li className="flex items-start gap-2.5 justify-end">
                        <span className="text-[#111] text-sm text-right">מחיר נעול - לא ישתנה לרעה</span>
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      </li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="specs" className="mt-4">
                  {specs.length > 0 ? (
                    <div className="grid gap-2">
                      {specs.map((spec, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-[#777] text-sm">{spec.value}</span>
                          <span className="font-semibold text-[#111] text-sm">{spec.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[#777] py-6 text-sm">אין מפרט זמין</p>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <Card key={review.id} className="border-2 rounded-xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <Avatar>
                                  <AvatarFallback className="bg-[#7B2FF7] text-white text-sm">
                                    {review.userName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-[#111] text-sm">{review.userName}</p>
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3.5 w-3.5 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-gray-200 text-gray-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-[#777]">
                                {new Date(review.date).toLocaleDateString("he-IL")}
                              </span>
                            </div>
                            <p className="text-[#111] text-sm">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[#777] py-6 text-sm">אין ביקורות עדיין</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-5">
              <h3 className="text-lg font-bold text-[#111] mb-3">משתתפים</h3>
              <ParticipantsList 
                dealId={deal.id} 
                originalPrice={originalPrice}
                tiers={deal.tiers}
                totalParticipants={unitsSold}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
