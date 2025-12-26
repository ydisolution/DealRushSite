import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MapPin, TrendingDown, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Participant {
  id: string;
  dealId: string;
  name: string;
  pricePaid: number;
  position: number;
  joinedAt: string;
}

interface ParticipantsListProps {
  dealId: string;
  originalPrice: number;
  tiers?: Array<{
    minParticipants: number;
    maxParticipants: number;
    discount: number;
  }>;
  totalParticipants?: number;
}

function getInitials(name: string): string {
  // מחזיר רק את האותיות הראשונות בעברית/אנגלית
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatPrice(price: number): string {
  return `₪${price.toLocaleString()}`;
}

export default function ParticipantsList({ dealId, originalPrice, tiers = [], totalParticipants = 0 }: ParticipantsListProps) {
  const { data: participants = [], isLoading } = useQuery<Participant[]>({
    queryKey: ['/api/deals', dealId, 'participants'],
  });

  // חישוב מדרגה נוכחית
  const getCurrentTier = () => {
    if (!tiers || tiers.length === 0) return null;
    
    const sortedTiers = [...tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    const units = totalParticipants || participants.length;
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      if (units >= tier.minParticipants && units <= tier.maxParticipants) {
        return {
          tier,
          tierNumber: i + 1,
          totalTiers: sortedTiers.length,
        };
      }
    }
    
    // אם עברנו את כל המדרגות, החזר את האחרונה
    if (units > sortedTiers[sortedTiers.length - 1].maxParticipants) {
      return {
        tier: sortedTiers[sortedTiers.length - 1],
        tierNumber: sortedTiers.length,
        totalTiers: sortedTiers.length,
      };
    }
    
    return null;
  };

  const currentTierInfo = getCurrentTier();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            רשימת משתתפים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="participants-list">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-6 w-6 text-[#7B2FF7]" />
            משתתפים ({participants.length} יחידות)
          </CardTitle>
          
          {/* Current Tier Indicator */}
          {currentTierInfo && (
            <Badge className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 text-white text-sm px-3 py-1.5">
              <TrendingDown className="h-4 w-4 ml-1.5" />
              מדרגה {currentTierInfo.tierNumber}/{currentTierInfo.totalTiers} • {currentTierInfo.tier.discount}% הנחה
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-gray-100">
            {participants.map((participant, index) => {
              const isFirst = participant.position === 1;
              const isLast = participant.position === participants.length;
              
              return (
                <div 
                  key={participant.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-purple-50/50 transition-colors"
                  data-testid={`participant-${participant.id}`}
                >
                  {/* Price - Left Side */}
                  <div className="text-left">
                    <p className="font-bold text-lg text-[#7B2FF7]" data-testid={`participant-price-${participant.id}`}>
                      {formatPrice(participant.pricePaid)}
                    </p>
                  </div>
                  
                  {/* Name and Position - Right Side */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      {isFirst && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-xs px-2">
                          ראשון
                          <Award className="h-3 w-3 mr-1" />
                        </Badge>
                      )}
                      <p className="font-bold text-base text-gray-900" data-testid={`participant-initials-${participant.id}`}>
                        {getInitials(participant.name)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-sm text-gray-600">
                      <span>מיקום #{participant.position}</span>
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {/* Avatar with Initials */}
                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                    <AvatarFallback className="text-base bg-gradient-to-br from-purple-100 to-purple-50 text-[#7B2FF7] font-bold">
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
