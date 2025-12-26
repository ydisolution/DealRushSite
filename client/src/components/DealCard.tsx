import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, TrendingDown, Sparkles, Edit, Info, Check, Lock } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import ProgressBar from "./ProgressBar";
import { calculatePositionPricing } from "@/lib/pricing";

export interface Deal {
  id: string;
  name: string;
  description?: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  participants: number;
  targetParticipants: number;
  endTime: Date;
  nextTierPrice?: number;
  nextTierParticipants?: number;
  category?: string;
  discountPercent?: number;
  currentTierDiscount?: number;
  tiers?: Array<{
    minParticipants: number;
    maxParticipants: number;
    price?: number;
    discount: number;
  }>;
}

interface DealCardProps {
  deal: Deal;
  onJoin?: (dealId: string) => void;
  onView?: (dealId: string) => void;
  isAdmin?: boolean;
  onEdit?: (dealId: string) => void;
}

export default function DealCard({ deal, onJoin, onView, isAdmin, onEdit }: DealCardProps) {
  const {
    id,
    name,
    image,
    originalPrice,
    currentPrice,
    participants,
    targetParticipants,
    endTime,
    nextTierPrice,
    nextTierParticipants,
  } = deal;

  // Debug: Log tiers data
  if (deal.tiers) {
    console.log(`Deal ${name} has ${deal.tiers.length} tiers:`, deal.tiers);
  }

  const participantsToNextTier = nextTierParticipants 
    ? nextTierParticipants - participants 
    : null;

  const calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  const discount = deal.discountPercent || calculatedDiscount;
  const { firstBuyerPrice, lastBuyerPrice, avgPrice } = calculatePositionPricing(currentPrice);

  return (
    <TooltipProvider>
      <Card 
        className="overflow-hidden hover-elevate cursor-pointer group"
        onClick={() => onView?.(id)}
        data-testid={`deal-card-${id}`}
        dir="rtl"
      >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-testid={`deal-image-${id}`}
        />
        <Badge 
          className="absolute top-3 left-3 gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground border-0"
          data-testid={`deal-participants-badge-${id}`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="font-bold">{participants}/{targetParticipants}</span>
        </Badge>
        <Badge 
          className="absolute top-3 right-3 bg-success text-success-foreground font-bold text-sm px-3 py-1.5 shadow-md"
          data-testid={`deal-discount-badge-${id}`}
        >
          {discount}% הנחה
        </Badge>
        {deal.currentTierDiscount && (
          <Badge 
            className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 shadow-md"
          >
            מדרגה {deal.currentTierDiscount}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 
          className="font-semibold text-base line-clamp-2 min-h-[2.5rem]"
          data-testid={`deal-name-${id}`}
        >
          {name}
        </h3>

        <div className="bg-gradient-to-br from-primary/10 to-accent/20 rounded-lg p-4 border border-primary/20 shadow-sm">
          <CountdownTimer endTime={endTime} size="md" centered showLabels={true} showEndDate={false} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-md p-2 text-center min-h-[60px] flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">מחיר פתיחה</p>
            <p className="font-bold text-sm line-through text-muted-foreground">
              ₪{originalPrice.toLocaleString()}
            </p>
          </div>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-center min-h-[60px] flex flex-col justify-center cursor-help hover:bg-primary/15 transition-colors">
                <p className="text-[10px] text-primary mb-0.5 flex items-center justify-center gap-1">
                  מחיר DealRush
                  <Info className="h-3 w-3" />
                </p>
                <p className="font-bold text-sm text-primary">
                  ₪{avgPrice.toLocaleString()}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">המחיר הממוצע כרגע של המוצר בדיל זה</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="bg-accent/30 rounded-md p-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ראשון משלם:</span>
            <span className="font-semibold text-success">₪{firstBuyerPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-muted-foreground">אחרון משלם:</span>
            <span className="font-semibold">₪{lastBuyerPrice.toLocaleString()}</span>
          </div>
        </div>

        <ProgressBar 
          current={participants} 
          target={targetParticipants}
          size="sm"
        />

        {/* Tiers Display */}
        {deal.tiers && deal.tiers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">מדרגות הנחה:</p>
            {deal.tiers.map((tier, index) => {
              const tierPrice = tier.price || Math.round(originalPrice * (1 - tier.discount / 100));
              const isUnlocked = participants >= tier.minParticipants;
              const isCurrent = participants >= tier.minParticipants && participants <= tier.maxParticipants;
              const isNext = !isUnlocked && index === deal.tiers!.findIndex(t => participants < t.minParticipants);
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    isCurrent 
                      ? 'bg-primary/15 border-primary/30 shadow-sm' 
                      : isUnlocked 
                        ? 'bg-success/10 border-green-700 shadow-sm' 
                        : isNext
                          ? 'bg-warning/10 border-warning/20'
                          : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground' 
                      : isUnlocked 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isUnlocked ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${
                        isCurrent ? 'text-primary' : isUnlocked ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        עד {tier.maxParticipants} יח'
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          נוכחי
                        </Badge>
                      )}
                      {isNext && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-warning text-warning">
                          הבא
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{tier.discount}% הנחה</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-left">
                    <p className={`text-sm font-bold ${
                      isCurrent ? 'text-primary' : isUnlocked ? 'text-success' : 'text-foreground'
                    }`}>
                      ₪{tierPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {nextTierPrice && participantsToNextTier && participantsToNextTier > 0 && (
          <div className="bg-gradient-to-br from-warning/15 to-success/15 border border-warning/30 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="bg-warning/20 p-1 rounded">
                  <Sparkles className="h-3.5 w-3.5 text-warning" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">מדרגה נוכחית</p>
                  <p className="text-sm font-bold text-foreground">{discount}% הנחה</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold text-muted-foreground">מדרגה הבאה</p>
                <p className="text-sm font-bold text-success">₪{nextTierPrice.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs mb-1.5">
              <span className="text-muted-foreground">עוד</span>
              <span className="font-bold text-warning px-1 bg-warning/10 rounded">{participantsToNextTier}</span>
              <span className="text-muted-foreground">יחידות למדרגה הבאה</span>
            </div>
            
            <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-success via-warning to-primary transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.min(100, Math.max(5, ((participants) / (participants + participantsToNextTier)) * 100))}%` 
                }}
              />
            </div>
          </div>
        )}

        {isAdmin ? (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              className="gap-2" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(id);
              }}
            >
              <Edit className="h-4 w-4" />
              ערוך דיל
            </Button>
            <Button 
              className="gap-2" 
              onClick={(e) => {
                e.stopPropagation();
                onView?.(id);
              }}
            >
              צפה בדיל
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full gap-2" 
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(id);
            }}
            data-testid={`button-join-deal-${id}`}
          >
            <TrendingDown className="h-4 w-4" />
            הצטרפו עכשיו
          </Button>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
