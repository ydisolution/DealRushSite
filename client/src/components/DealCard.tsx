import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, Sparkles } from "lucide-react";
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
}

interface DealCardProps {
  deal: Deal;
  onJoin?: (dealId: string) => void;
  onView?: (dealId: string) => void;
}

export default function DealCard({ deal, onJoin, onView }: DealCardProps) {
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

  const participantsToNextTier = nextTierParticipants 
    ? nextTierParticipants - participants 
    : null;

  const calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  const discount = deal.discountPercent || calculatedDiscount;
  const { firstBuyerPrice, lastBuyerPrice, avgPrice } = calculatePositionPricing(currentPrice);

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer group"
      onClick={() => onView?.(id)}
      data-testid={`deal-card-${id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-testid={`deal-image-${id}`}
        />
        <Badge 
          className="absolute top-3 left-3 gap-1.5 bg-background/90 backdrop-blur-sm text-foreground border"
          data-testid={`deal-participants-badge-${id}`}
        >
          <Users className="h-3.5 w-3.5" />
          {participants} קונים
        </Badge>
        <Badge 
          className="absolute top-3 right-3 bg-success text-success-foreground font-bold text-sm px-3 py-1.5 shadow-md"
          data-testid={`deal-discount-badge-${id}`}
        >
          {discount}% הנחה
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 
          className="font-semibold text-base line-clamp-2 min-h-[2.5rem]"
          data-testid={`deal-name-${id}`}
        >
          {name}
        </h3>

        <div className="bg-muted/50 rounded-lg p-3">
          <CountdownTimer endTime={endTime} size="sm" centered showLabels={true} showEndDate={true} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded-md p-2 text-center min-h-[60px] flex flex-col justify-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">מחיר התחלתי</p>
            <p className="font-bold text-sm line-through text-muted-foreground">
              ₪{originalPrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-md p-2 text-center min-h-[60px] flex flex-col justify-center">
            <p className="text-[10px] text-primary mb-0.5">DealRush</p>
            <p className="font-bold text-sm text-primary">
              ₪{avgPrice.toLocaleString()}
            </p>
          </div>
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

        {nextTierPrice && participantsToNextTier && participantsToNextTier > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 border border-accent">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs">
              <span className="font-medium">עוד {participantsToNextTier} אנשים</span>
              <span className="text-muted-foreground"> והמחיר יורד ל-</span>
              <span className="font-bold text-primary">₪{nextTierPrice.toLocaleString()}</span>
            </p>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}
