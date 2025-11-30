import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, TrendingDown, Sparkles } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import ProgressBar from "./ProgressBar";
import PriceDisplay from "./PriceDisplay";

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
      </div>
      
      <CardContent className="p-4 space-y-4">
        <h3 
          className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]"
          data-testid={`deal-name-${id}`}
        >
          {name}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>נותר זמן:</span>
        </div>
        <CountdownTimer endTime={endTime} size="sm" />

        <PriceDisplay 
          originalPrice={originalPrice} 
          currentPrice={currentPrice} 
          size="sm"
          showSavings={false}
        />

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
