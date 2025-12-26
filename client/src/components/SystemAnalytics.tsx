import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Activity,
  Target,
  Award,
  Clock,
  BarChart3
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";

interface Deal {
  id: string;
  name: string;
  status: string;
  participants: number;
  targetParticipants: number;
  currentPrice: number;
  originalPrice: number;
  createdAt: string;
  endTime: string;
}

interface Participant {
  id: string;
  dealId: string;
  userId: string;
  joinedAt: string;
  paymentStatus: string;
  chargedAmount?: number;
  pricePaid: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isSupplier: string;
  isAdmin: string;
}

interface TimeSeriesData {
  date: string;
  joins: number;
  revenue: number;
  newUsers: number;
}

interface CategoryStats {
  category: string;
  deals: number;
  revenue: number;
  participants: number;
}

export default function SystemAnalytics() {
  // Fetch all deals
  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/admin/all-deals"],
  });

  // Fetch all participants
  const { data: allParticipants = [] } = useQuery<Participant[]>({
    queryKey: ["/api/admin/all-participants"],
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Calculate statistics
  const activeDeals = allDeals.filter(d => d.status === 'active');
  const completedDeals = allDeals.filter(d => d.status === 'completed');
  const chargedParticipants = allParticipants.filter(p => p.paymentStatus === 'charged');
  const customers = allUsers.filter(u => u.isSupplier !== 'true' && u.isAdmin !== 'true');

  // Total revenue
  const totalRevenue = chargedParticipants.reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
  
  // Platform commission (10%)
  const platformProfit = totalRevenue * 0.1;

  // Time series data - last 30 days
  const getLast30Days = () => {
    const days: TimeSeriesData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Joins per day
      const dayJoins = allParticipants.filter(p => {
        if (!p.joinedAt) return false;
        const joinDate = format(new Date(p.joinedAt), 'yyyy-MM-dd');
        return joinDate === dateStr;
      });

      // Revenue per day
      const dayRevenue = dayJoins
        .filter(p => p.paymentStatus === 'charged')
        .reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);

      // New users per day
      const newUsers = customers.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = format(new Date(u.createdAt), 'yyyy-MM-dd');
        return createdDate === dateStr;
      });

      days.push({
        date: dateStr,
        joins: dayJoins.length,
        revenue: dayRevenue,
        newUsers: newUsers.length,
      });
    }
    return days;
  };

  const timeSeriesData = getLast30Days();

  // Calculate daily averages
  const avgJoinsPerDay = timeSeriesData.reduce((sum, d) => sum + d.joins, 0) / 30;
  const avgRevenuePerDay = timeSeriesData.reduce((sum, d) => sum + d.revenue, 0) / 30;
  const avgNewUsersPerDay = timeSeriesData.reduce((sum, d) => sum + d.newUsers, 0) / 30;

  // Last 7 days
  const last7Days = timeSeriesData.slice(-7);
  const last7DaysJoins = last7Days.reduce((sum, d) => sum + d.joins, 0);
  const last7DaysRevenue = last7Days.reduce((sum, d) => sum + d.revenue, 0);
  const last7DaysNewUsers = last7Days.reduce((sum, d) => sum + d.newUsers, 0);

  // Today's data
  const today = timeSeriesData[timeSeriesData.length - 1];

  // Conversion rate
  const conversionRate = customers.length > 0 
    ? (chargedParticipants.length / customers.length) * 100 
    : 0;

  // Average deal completion rate
  const avgCompletionRate = completedDeals.length > 0
    ? completedDeals.reduce((sum, d) => sum + ((d.participants / d.targetParticipants) * 100), 0) / completedDeals.length
    : 0;

  // Active deals fill rate
  const activeFillRate = activeDeals.length > 0
    ? activeDeals.reduce((sum, d) => sum + ((d.participants / d.targetParticipants) * 100), 0) / activeDeals.length
    : 0;

  // Category breakdown (מניחים שיש שדה category)
  const categoryStats: Record<string, CategoryStats> = {};
  allDeals.forEach(deal => {
    const category = (deal as any).category || 'אחר';
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        deals: 0,
        revenue: 0,
        participants: 0,
      };
    }
    categoryStats[category].deals++;
    
    const dealParts = allParticipants.filter(p => p.dealId === deal.id && p.paymentStatus === 'charged');
    categoryStats[category].participants += dealParts.length;
    categoryStats[category].revenue += dealParts.reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
  });

  const topCategories = Object.values(categoryStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Growth trends (compare last 7 days to previous 7 days)
  const previous7Days = timeSeriesData.slice(-14, -7);
  const previous7DaysJoins = previous7Days.reduce((sum, d) => sum + d.joins, 0);
  const previous7DaysRevenue = previous7Days.reduce((sum, d) => sum + d.revenue, 0);
  
  const joinsGrowth = previous7DaysJoins > 0 
    ? ((last7DaysJoins - previous7DaysJoins) / previous7DaysJoins) * 100 
    : 0;
  const revenueGrowth = previous7DaysRevenue > 0 
    ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              רווח פלטפורמה: ₪{platformProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות פעילים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              שיעור המרה: {conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">דילים פעילים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals.length}</div>
            <p className="text-xs text-muted-foreground">
              אחוז מילוי: {activeFillRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">רכישות</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chargedParticipants.length}</div>
            <p className="text-xs text-muted-foreground">
              ממוצע לדיל: {(chargedParticipants.length / Math.max(allDeals.length, 1)).toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            פעילות היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">הצטרפויות חדשות</p>
              <p className="text-2xl font-bold">{today?.joins || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">הכנסות היום</p>
              <p className="text-2xl font-bold">₪{(today?.revenue || 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">לקוחות חדשים</p>
              <p className="text-2xl font-bold">{today?.newUsers || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              7 ימים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">הצטרפויות</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{last7DaysJoins}</span>
                {joinsGrowth !== 0 && (
                  <span className={`text-xs flex items-center gap-1 ${joinsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {joinsGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(joinsGrowth).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">הכנסות</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">₪{last7DaysRevenue.toLocaleString()}</span>
                {revenueGrowth !== 0 && (
                  <span className={`text-xs flex items-center gap-1 ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">לקוחות חדשים</span>
              <span className="text-2xl font-bold">{last7DaysNewUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ממוצעים יומיים (30 יום)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">הצטרפויות ביום</span>
              <span className="text-2xl font-bold">{avgJoinsPerDay.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">הכנסות ביום</span>
              <span className="text-2xl font-bold">₪{avgRevenuePerDay.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">לקוחות חדשים ביום</span>
              <span className="text-2xl font-bold">{avgNewUsersPerDay.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            מדדי ביצועים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">אחוז השלמת דילים</span>
                <span className="text-sm font-bold">{avgCompletionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(avgCompletionRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {completedDeals.length} דילים הושלמו
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">מילוי דילים פעילים</span>
                <span className="text-sm font-bold">{activeFillRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(activeFillRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {activeDeals.length} דילים פעילים
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">שיעור המרה לקוחות</span>
                <span className="text-sm font-bold">{conversionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(conversionRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {chargedParticipants.length} רכישות מ-{customers.length} לקוחות
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            פילוח לפי קטגוריות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCategories.map((cat, index) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-xs text-muted-foreground">
                      ({cat.deals} דילים)
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">₪{cat.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{cat.participants} רכישות</div>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${(cat.revenue / Math.max(...topCategories.map(c => c.revenue))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Series Chart (Simple bars) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            מגמות 30 יום אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Joins Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">הצטרפויות ליום</h4>
              <div className="flex items-end gap-1 h-32">
                {timeSeriesData.map((day, i) => {
                  const maxJoins = Math.max(...timeSeriesData.map(d => d.joins), 1);
                  const height = (day.joins / maxJoins) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${height}%`, minHeight: day.joins > 0 ? '4px' : '0' }}
                      title={`${format(new Date(day.date), 'dd/MM', { locale: he })}: ${day.joins} הצטרפויות`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(new Date(timeSeriesData[0].date), 'dd/MM')}</span>
                <span>{format(new Date(timeSeriesData[timeSeriesData.length - 1].date), 'dd/MM')}</span>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">הכנסות ליום (₪)</h4>
              <div className="flex items-end gap-1 h-32">
                {timeSeriesData.map((day, i) => {
                  const maxRevenue = Math.max(...timeSeriesData.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-green-500/80 rounded-t transition-all hover:bg-green-500"
                      style={{ height: `${height}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                      title={`${format(new Date(day.date), 'dd/MM', { locale: he })}: ₪${day.revenue.toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(new Date(timeSeriesData[0].date), 'dd/MM')}</span>
                <span>{format(new Date(timeSeriesData[timeSeriesData.length - 1].date), 'dd/MM')}</span>
              </div>
            </div>

            {/* New Users Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">לקוחות חדשים ליום</h4>
              <div className="flex items-end gap-1 h-32">
                {timeSeriesData.map((day, i) => {
                  const maxUsers = Math.max(...timeSeriesData.map(d => d.newUsers), 1);
                  const height = (day.newUsers / maxUsers) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500/80 rounded-t transition-all hover:bg-blue-500"
                      style={{ height: `${height}%`, minHeight: day.newUsers > 0 ? '4px' : '0' }}
                      title={`${format(new Date(day.date), 'dd/MM', { locale: he })}: ${day.newUsers} לקוחות`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(new Date(timeSeriesData[0].date), 'dd/MM')}</span>
                <span>{format(new Date(timeSeriesData[timeSeriesData.length - 1].date), 'dd/MM')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
