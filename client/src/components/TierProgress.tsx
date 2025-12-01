import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Sparkles, Calculator } from "lucide-react";
import { calculatePricingFromTier } from "@/lib/pricing";

interface Tier {
  minParticipants: number;
  maxParticipants: number;
  price?: number;
  discount: number;
}

interface TierProgressProps {
  tiers: Tier[];
  currentParticipants: number;
  originalPrice: number;
  userPosition?: number;
}

export default function TierProgress({ 
  tiers, 
  currentParticipants,
  originalPrice,
}: TierProgressProps) {
  const getCurrentTierIndex = () => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentParticipants >= tiers[i].minParticipants) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTierIndex();

  return (
    <Card data-testid="tier-progress">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          שלבי הנחה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map((tier, index) => {
          const isCompleted = currentParticipants >= tier.maxParticipants;
          const isCurrent = index === currentTierIndex && !isCompleted;
          const participantsNeeded = tier.minParticipants - currentParticipants;
          
          const { firstBuyerPrice, lastBuyerPrice, avgPrice } = calculatePricingFromTier(tier, originalPrice);
          const tierSize = tier.maxParticipants - tier.minParticipants + 1;
          
          return (
            <div 
              key={index}
              className={`p-3 rounded-md transition-colors ${
                isCurrent 
                  ? "bg-primary/10 border border-primary/20" 
                  : isCompleted 
                    ? "bg-success/5" 
                    : "bg-muted/50"
              }`}
              data-testid={`tier-${index}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isCurrent ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${isCurrent ? "font-medium" : ""}`}>
                      {tier.minParticipants === tier.maxParticipants 
                        ? `משתתף ${tier.minParticipants}`
                        : `${tier.minParticipants}-${tier.maxParticipants} משתתפים`
                      }
                    </span>
                    <span className="text-sm text-success font-medium">
                      {tier.discount}% הנחה
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mr-8 bg-background/50 rounded p-2 text-xs space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Calculator className="h-3 w-3" />
                  <span>מחירים לפי מיקום:</span>
                </div>
                {tierSize === 1 ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">מחיר:</span>
                    <span className="font-semibold">₪{avgPrice.toLocaleString()}</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {isCurrent && participantsNeeded > 0 && (
                <p className="text-xs text-primary font-medium mr-8 mt-2">
                  עוד {participantsNeeded} אנשים למדרגה הזו
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
