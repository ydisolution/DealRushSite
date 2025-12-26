import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Package,
  BarChart3,
  Calendar,
  Percent
} from "lucide-react";

interface CompletedDeal {
  id: string;
  name: string;
  participants: number;
  totalRevenue: number;
  avgPrice: number;
  avgUnitsPerCustomer: number;
  duration: number; // in hours
  category: string;
  completionRate: number; // percentage of target reached
}

interface CompletedDealsAnalyticsProps {
  deals: CompletedDeal[];
}

export default function CompletedDealsAnalytics({ deals }: CompletedDealsAnalyticsProps) {
  if (!deals || deals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">אין דילים שהסתיימו</h3>
          <p className="text-muted-foreground">
            נתונים יופיעו כאן לאחר סגירת דילים ראשונים
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated statistics
  const totalDeals = deals.length;
  const totalParticipants = deals.reduce((sum, d) => sum + d.participants, 0);
  const totalUnits = deals.reduce((sum, d) => sum + d.participants, 0); // Assuming 1 unit per participant for now
  const totalRevenue = deals.reduce((sum, d) => sum + d.totalRevenue, 0);
  
  const avgUnitsPerDeal = totalDeals > 0 ? (totalUnits / totalDeals).toFixed(1) : '0';
  const avgUnitsPerCustomer = totalParticipants > 0 ? (totalUnits / totalParticipants).toFixed(2) : '0';
  const avgPrice = totalUnits > 0 ? Math.round(totalRevenue / totalUnits) : 0;
  const avgDuration = totalDeals > 0 
    ? Math.round(deals.reduce((sum, d) => sum + d.duration, 0) / totalDeals / 24) // Convert to days
    : 0;

  // Find best performing deal
  const bestDeal = deals.reduce((best, current) => 
    current.totalRevenue > best.totalRevenue ? current : best
  , deals[0]);

  // Category breakdown
  const categoryStats = deals.reduce((acc, deal) => {
    if (!acc[deal.category]) {
      acc[deal.category] = { count: 0, revenue: 0, participants: 0 };
    }
    acc[deal.category].count++;
    acc[deal.category].revenue += deal.totalRevenue;
    acc[deal.category].participants += deal.participants;
    return acc;
  }, {} as Record<string, { count: number; revenue: number; participants: number }>);

  const sortedCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ניתוח דילים שהסתיימו</h2>
        <Badge variant="outline" className="text-sm">
          <Calendar className="h-4 w-4 ml-1" />
          {totalDeals} דילים הושלמו
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה"כ רוכשים</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-xs text-muted-foreground">
                  ממוצע {(totalParticipants / totalDeals).toFixed(1)} לדיל
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <ShoppingCart className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">יחידות שנמכרו</p>
                <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  ממוצע {avgUnitsPerDeal} לדיל
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">יחידות ללקוח</p>
                <p className="text-2xl font-bold">{avgUnitsPerCustomer}</p>
                <p className="text-xs text-muted-foreground">
                  ממוצע יחידות לרוכש
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">מחיר ממוצע</p>
                <p className="text-2xl font-bold">₪{avgPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  ליחידה
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue and Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              סיכום פיננסי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg">
              <span className="text-sm font-medium">סה"כ הכנסות</span>
              <span className="text-xl font-bold text-success">
                ₪{totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">ממוצע הכנסה לדיל</span>
              <span className="text-lg font-semibold">
                ₪{Math.round(totalRevenue / totalDeals).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">משך זמן ממוצע</span>
              </div>
              <span className="text-lg font-semibold">
                {avgDuration} ימים
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Best Deal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              הדיל המוביל
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-primary/5 rounded-lg border-2 border-primary/20">
              <h4 className="font-semibold text-lg mb-2">{bestDeal.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">רוכשים</p>
                  <p className="font-semibold">{bestDeal.participants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">הכנסות</p>
                  <p className="font-semibold text-success">
                    ₪{bestDeal.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">מחיר ממוצע</p>
                  <p className="font-semibold">₪{Math.round(bestDeal.avgPrice).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">משך זמן</p>
                  <p className="font-semibold">{Math.round(bestDeal.duration / 24)} ימים</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            פילוח לפי קטגוריות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedCategories.map(([category, stats], index) => {
              const percentage = ((stats.revenue / totalRevenue) * 100).toFixed(1);
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {stats.count} דילים
                      </Badge>
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">₪{stats.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{percentage}% מהכנסות</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>פירוט כל הדילים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-4 p-3 bg-muted rounded-lg font-semibold text-sm">
              <div>שם הדיל</div>
              <div className="text-center">רוכשים</div>
              <div className="text-center">יחידות</div>
              <div className="text-center">הכנסות</div>
              <div className="text-center">מחיר ממוצע</div>
              <div className="text-center">משך זמן</div>
            </div>
            {deals.map((deal) => (
              <div key={deal.id} className="grid grid-cols-6 gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="font-medium truncate">{deal.name}</div>
                <div className="text-center">{deal.participants}</div>
                <div className="text-center">{deal.participants}</div>
                <div className="text-center font-semibold text-success">
                  ₪{deal.totalRevenue.toLocaleString()}
                </div>
                <div className="text-center">₪{Math.round(deal.avgPrice).toLocaleString()}</div>
                <div className="text-center">{Math.round(deal.duration / 24)}d</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
