import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, TrendingDown } from "lucide-react";
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
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + "." + parts[1][0] + ".";
  }
  return parts[0][0] + ".";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `לפני ${diffMins} דקות`;
  } else if (diffHours < 24) {
    return `לפני ${diffHours} שעות`;
  } else {
    return `לפני ${diffDays} ימים`;
  }
}

export default function ParticipantsList({ dealId, originalPrice }: ParticipantsListProps) {
  const { data: participants = [], isLoading } = useQuery<Participant[]>({
    queryKey: ['/api/deals', dealId, 'participants'],
  });

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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          רשימת משתתפים ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {participants.map((participant) => {
              const savings = originalPrice - participant.pricePaid;
              const savingsPercent = Math.round((savings / originalPrice) * 100);
              
              return (
                <div 
                  key={participant.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  data-testid={`participant-${participant.id}`}
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground w-8">
                    #{participant.position}
                  </div>
                  
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-accent">
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" data-testid={`participant-initials-${participant.id}`}>
                      {getInitials(participant.name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(participant.joinedAt)}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <p className="font-semibold text-sm" data-testid={`participant-price-${participant.id}`}>
                      ₪{participant.pricePaid.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {savingsPercent}%-
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
