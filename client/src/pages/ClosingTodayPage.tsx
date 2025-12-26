import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Clock, TrendingDown, Users, AlertTriangle, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/CountdownTimer";
import type { Deal } from "@shared/schema";

export default function ClosingTodayPage() {
  const [, setLocation] = useLocation();

  const { data: allDeals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const closingTodayDeals = allDeals.filter((deal) => {
    const endTime = new Date(deal.endTime);
    const now = new Date();
    const hoursRemaining = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining <= 24;
  }).sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

  const getUrgencyLevel = (endTime: Date) => {
    const now = new Date();
    const hoursRemaining = (new Date(endTime).getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 1) return { level: "critical", text: "נסגר תוך שעה!", color: "bg-red-500" };
    if (hoursRemaining <= 3) return { level: "urgent", text: "נסגר בקרוב מאוד", color: "bg-orange-500" };
    if (hoursRemaining <= 6) return { level: "warning", text: "נסגר בעוד מספר שעות", color: "bg-yellow-500" };
    return { level: "safe", text: "נסגר היום", color: "bg-green-500" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl" data-testid="closing-today-page">
      <div className="bg-gradient-to-b from-urgent/10 to-background py-8 border-b">
        <div className="container mx-auto px-4" dir="rtl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-urgent/20 animate-pulse">
              <Flame className="h-8 w-8 text-urgent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">דילים שנסגרים היום</h1>
              <p className="text-muted-foreground">הזדמנות אחרונה להצטרף לדילים הללו!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="gap-1 px-3 py-1.5">
              <Clock className="h-4 w-4" />
              {closingTodayDeals.length} דילים נסגרים
            </Badge>
            <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back-home">
              חזרה לכל הדילים
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {closingTodayDeals.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">אין דילים שנסגרים היום</h2>
              <p className="text-muted-foreground mb-4">
                כרגע אין דילים שמסתיימים ב-24 השעות הקרובות
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-view-all-deals">
                צפו בכל הדילים
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closingTodayDeals.map((deal) => {
              const urgency = getUrgencyLevel(new Date(deal.endTime));
              const discount = Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100);

              return (
                <Card 
                  key={deal.id} 
                  className="overflow-hidden hover-elevate cursor-pointer relative"
                  onClick={() => setLocation(`/deal/${deal.id}`)}
                  data-testid={`closing-deal-card-${deal.id}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${urgency.color}`} />
                  
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img 
                      src={deal.images?.[0] || "https://via.placeholder.com/400"} 
                      alt={deal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 right-3 left-3">
                      <Badge className={`${urgency.color} text-white gap-1`}>
                        <AlertTriangle className="h-3 w-3" />
                        {urgency.text}
                      </Badge>
                    </div>
                    <Badge className="absolute top-3 left-3 bg-success text-success-foreground">
                      -{discount}%
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-3 line-clamp-2">{deal.name}</h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CountdownTimer 
                          endTime={new Date(deal.endTime)} 
                          size="sm" 
                          showLabels={true}
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">מחיר נוכחי</p>
                        <p className="text-xl font-bold text-primary">₪{deal.currentPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{deal.participants} קונים</span>
                      </div>
                      <div className="flex items-center gap-1 text-success">
                        <TrendingDown className="h-4 w-4" />
                        <span>חוסכים ₪{(deal.originalPrice - deal.currentPrice).toLocaleString()}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/deal/${deal.id}`);
                      }}
                      data-testid={`button-join-closing-deal-${deal.id}`}
                    >
                      <Flame className="h-4 w-4" />
                      הצטרפו לפני שנגמר!
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-accent/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">לא מצאתם מה שחיפשתם?</h3>
              <p className="text-muted-foreground mb-4">
                יש לנו עוד הרבה דילים מעולים שמתחדשים כל יום
              </p>
              <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-explore-all">
                לכל הדילים
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
