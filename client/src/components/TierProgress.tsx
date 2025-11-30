import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Sparkles } from "lucide-react";

interface Tier {
  minParticipants: number;
  maxParticipants: number;
  price: number;
  discount: number;
}

interface TierProgressProps {
  tiers: Tier[];
  currentParticipants: number;
  originalPrice: number;
}

export default function TierProgress({ 
  tiers, 
  currentParticipants,
  originalPrice 
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
          
          return (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                isCurrent 
                  ? "bg-primary/10 border border-primary/20" 
                  : isCompleted 
                    ? "bg-success/5" 
                    : "bg-muted/50"
              }`}
              data-testid={`tier-${index}`}
            >
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
                    {tier.minParticipants}-{tier.maxParticipants} משתתפים
                  </span>
                  <span className={`font-bold ${isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"}`}>
                    ₪{tier.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tier.discount}% הנחה</span>
                  {isCurrent && participantsNeeded > 0 && (
                    <span className="text-primary font-medium">
                      עוד {participantsNeeded} אנשים
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
