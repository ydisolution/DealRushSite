import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Eye, 
  Users, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";

interface SupplierAnalyticsProps {
  supplierId: string;
  dealIds: string[];
}

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalJoins: number;
  averageConversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  topPerformingDeals: any[];
}

export default function SupplierAnalytics({ supplierId, dealIds }: SupplierAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/suppliers/analytics", supplierId],
    enabled: dealIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics || dealIds.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">אין נתונים עדיין</h3>
          <p className="text-muted-foreground">
            צור דיל ראשון כדי לראות סטטיסטיקות וניתוחים
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: "סה\"כ צפיות",
      value: analytics.totalViews?.toLocaleString() || '0',
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "מבקרים ייחודיים",
      value: analytics.uniqueVisitors?.toLocaleString() || '0',
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "סה\"כ הצטרפויות",
      value: analytics.totalJoins?.toLocaleString() || '0',
      icon: ShoppingCart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "שיעור המרה",
      value: `${analytics.averageConversionRate?.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "הכנסות כוללות",
      value: `₪${analytics.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "ממוצע להזמנה",
      value: `₪${analytics.averageOrderValue?.toFixed(0) || '0'}`,
      icon: BarChart3,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">סטטיסטיקות וביצועים</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performing Deals */}
      {analytics.topPerformingDeals && analytics.topPerformingDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              דילים מצליחים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingDeals.map((deal: any, index: number) => (
                <div
                  key={deal.dealId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">דיל #{deal.dealId.substring(0, 8)}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{deal.views} צפיות</span>
                        <span>{deal.joins} הצטרפויות</span>
                        <span>{deal.conversionRate.toFixed(1)}% המרה</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600">
                      ₪{deal.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">הכנסה</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="performance">ביצועים</TabsTrigger>
          <TabsTrigger value="insights">תובנות</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>נתונים עיקריים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">יחס צפייה להצטרפות</span>
                  <span className="font-bold">
                    {analytics.averageConversionRate?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">ממוצע הכנסה לדיל</span>
                  <span className="font-bold">
                    ₪{analytics.topPerformingDeals?.length > 0 
                      ? (analytics.totalRevenue / dealIds.length).toFixed(0)
                      : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">סה\"כ דילים פעילים</span>
                  <span className="font-bold">{dealIds.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>ביצועים לפי זמן</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                גרפים של ביצועים לאורך זמן יתווספו בקרוב
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>תובנות והמלצות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.averageConversionRate < 5 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="font-medium text-yellow-700 dark:text-yellow-400">
                      💡 שיעור ההמרה נמוך
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      שקול להוסיף תמונות איכותיות יותר ולשפר את תיאור המוצרים
                    </p>
                  </div>
                )}
                {analytics.totalViews > 100 && analytics.totalJoins < 10 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="font-medium text-blue-700 dark:text-blue-400">
                      💡 יש עניין אבל מעט הצטרפויות
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      נסה להוריד את המחיר ההתחלתי או להציע הנחות גדולות יותר
                    </p>
                  </div>
                )}
                {analytics.averageConversionRate >= 10 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-medium text-green-700 dark:text-green-400">
                      🎉 ביצועים מצוינים!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      הדילים שלך מבצעים מצוין. המשך כך!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
