import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, UserPlus } from "lucide-react";

interface Activity {
  id: string;
  type: "join" | "price_drop";
  userName?: string;
  priceFrom?: number;
  priceTo?: number;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
}

export default function ActivityFeed({ 
  activities, 
  title = "פעילות אחרונה" 
}: ActivityFeedProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "עכשיו";
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    
    return `לפני ${Math.floor(diffHours / 24)} ימים`;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2);
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-center gap-3 text-sm"
            data-testid={`activity-${activity.id}`}
          >
            {activity.type === "join" && activity.userName ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-accent">
                    {getInitials(activity.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-muted-foreground"> הצטרף/ה לדיל</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(activity.timestamp)}</p>
                </div>
                <UserPlus className="h-4 w-4 text-success shrink-0" />
              </>
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    <span className="text-muted-foreground">המחיר ירד ל-</span>
                    <span className="font-bold text-success">₪{activity.priceTo?.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(activity.timestamp)}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
