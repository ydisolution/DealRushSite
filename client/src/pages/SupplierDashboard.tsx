import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Plus,
  BarChart3,
  FileText,
  Send,
  Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";
import CompletedDealsAnalytics from "@/components/CompletedDealsAnalytics";

interface DealAggregates {
  totalUnits: number;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  avgUnitPrice: number;
  customerCount: number;
}

interface SupplierDeal {
  id: string;
  name: string;
  description: string;
  status: string;
  originalPrice: number;
  costPrice?: number;
  currentPrice: number;
  createdAt: string;
  approvedAt?: string;
  closedAt?: string;
  platformCommission: number;
  aggregates: DealAggregates;
}

interface DealCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  unitsPurchased: number;
  unitPricePaid: number;
  totalPaid: number;
  purchasedAt: Date;
  paymentStatus: string | null;
  chargedAmount: number | null;
  needsShipping: boolean | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingZipCode: string | null;
  shippingCost: number;
  units: Array<{
    id: string;
    position: number;
    pricePaid: number;
    quantity: number;
  }>;
}

interface DealDetails extends SupplierDeal {
  customers: DealCustomer[];
}

interface SupplierStats {
  totalDeals: number;
  activeDeals: number;
  pendingDeals: number;
  draftDeals: number;
  closedDeals: number;
  totalUnits: number;
  grossRevenue: number;
  totalCommission: number;
  netRevenue: number;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "טיוטה", variant: "outline" },
    pending: { label: "ממתין לאישור", variant: "secondary" },
    approved: { label: "מאושר", variant: "default" },
    active: { label: "פעיל", variant: "default" },
    live: { label: "חי", variant: "default" },
    closed: { label: "נסגר", variant: "secondary" },
    cancelled: { label: "בוטל", variant: "destructive" },
  };
  
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SupplierDashboard() {
  const { isAuthenticated, isSupplier, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDeal, setSelectedDeal] = useState<DealDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // WebSocket listener for deal approval/rejection notifications
  useEffect(() => {
    if (!user?.id) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === "deal_approved" && message.supplierId === user.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/suppliers/deals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
        toast({
          title: "הדיל אושר! 🎉",
          description: `הדיל "${message.dealName}" אושר והועלה לאוויר`,
        });
      } else if (message.type === "deal_rejected" && message.supplierId === user.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/suppliers/deals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
        toast({
          title: "הדיל נדחה",
          description: `הדיל "${message.dealName}" נדחה. ${message.rejectionReason}`,
          variant: "destructive",
        });
      }
    };
    
    return () => ws.close();
  }, [user?.id, toast]);

  // Check authentication and supplier status
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isSupplier) {
    return (
      <div className="container mx-auto px-4 py-8 text-center" dir="rtl">
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">גישה נדחתה</h1>
          <p className="text-muted-foreground mb-6">רק ספקים יכולים לגשת לדף זה</p>
          <Button onClick={() => setLocation('/')}>
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery<SupplierStats>({
    queryKey: ["/api/suppliers/stats"],
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<SupplierDeal[]>({
    queryKey: ["/api/suppliers/deals"],
  });

  const { data: dealDetails, isLoading: detailsLoading } = useQuery<DealDetails>({
    queryKey: ["/api/suppliers/deals", selectedDeal?.id],
    enabled: !!selectedDeal?.id && detailsOpen,
  });

  const openDealDetails = (deal: SupplierDeal) => {
    setSelectedDeal(deal as DealDetails);
    setDetailsOpen(true);
  };

  const isLoading = statsLoading || dealsLoading;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl" dir="rtl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">דשבורד ספק</h1>
            <p className="text-muted-foreground mt-1">נהל את הדילים שלך וצפה בסטטיסטיקות</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/supplier-settings">
              <Button variant="outline" size="icon" data-testid="button-supplier-settings" title="הגדרות ספק">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/supplier/orders">
              <Button variant="outline" data-testid="button-supplier-orders">
                <Package className="h-4 w-4 ml-2" />
                ניהול הזמנות
              </Button>
            </Link>
            <Link href="/supplier/deals/new">
              <Button data-testid="button-create-deal">
                <Plus className="h-4 w-4 ml-2" />
                צור דיל חדש
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="stat-total-units">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ יחידות שנמכרו</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalUnits.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-gross-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">הכנסות ברוטו</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.grossRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-commission">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">עמלה לפלטפורמה</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {statsLoading ? "..." : formatCurrency(stats?.totalCommission || 0)}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-net-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">הכנסות נטו</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {statsLoading ? "..." : formatCurrency(stats?.netRevenue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">דילים פעילים</p>
                  <p className="text-xl font-bold">{stats?.activeDeals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ממתינים לאישור</p>
                  <p className="text-xl font-bold">{stats?.pendingDeals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted-foreground/10">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">טיוטות</p>
                  <p className="text-xl font-bold">{stats?.draftDeals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">דילים שנסגרו</p>
                  <p className="text-xl font-bold">{stats?.closedDeals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">דילים פעילים</TabsTrigger>
            <TabsTrigger value="completed">ניתוח דילים שהסתיימו</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  הדילים שלי
                </CardTitle>
                <CardDescription>
                  כל הדילים שיצרת ופרטי הביצועים שלהם
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען נתונים...</div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">אין דילים עדיין</h3>
                <p className="text-muted-foreground mb-4">התחל על ידי יצירת הדיל הראשון שלך</p>
                <Link href="/supplier/deals/new">
                  <Button data-testid="button-create-first-deal">
                    <Plus className="h-4 w-4 ml-2" />
                    צור דיל ראשון
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם הדיל</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">יחידות</TableHead>
                      <TableHead className="text-right">מחיר ממוצע</TableHead>
                      <TableHead className="text-right">הכנסה ברוטו</TableHead>
                      <TableHead className="text-right">עמלה</TableHead>
                      <TableHead className="text-right">נטו</TableHead>
                      <TableHead className="text-right">תאריך יצירה</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id} data-testid={`deal-row-${deal.id}`}>
                        <TableCell className="font-medium">{deal.name}</TableCell>
                        <TableCell>{getStatusBadge(deal.status)}</TableCell>
                        <TableCell>{deal.aggregates.totalUnits}</TableCell>
                        <TableCell>{formatCurrency(deal.aggregates.avgUnitPrice)}</TableCell>
                        <TableCell>{formatCurrency(deal.aggregates.grossRevenue)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(deal.aggregates.commission)}
                        </TableCell>
                        <TableCell className="font-semibold text-success">
                          {formatCurrency(deal.aggregates.netRevenue)}
                        </TableCell>
                        <TableCell>{formatDate(deal.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openDealDetails(deal)}
                              data-testid={`button-view-deal-${deal.id}`}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              פרטים
                            </Button>
                            {deal.status === "draft" && (
                              <Button 
                                size="sm"
                                variant="default"
                                data-testid={`button-submit-deal-${deal.id}`}
                              >
                                <Send className="h-4 w-4 ml-1" />
                                שלח לאישור
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedDeal?.name || "פרטי דיל"}
              </DialogTitle>
              <DialogDescription>
                {selectedDeal?.description}
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="py-8 text-center text-muted-foreground">טוען פרטים...</div>
            ) : dealDetails ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">סטטוס</p>
                      <div className="mt-1">{getStatusBadge(dealDetails.status)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">יחידות שנמכרו</p>
                      <p className="text-2xl font-bold">{dealDetails.aggregates.totalUnits}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">הכנסה נטו</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(dealDetails.aggregates.netRevenue)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    רשימת לקוחות ({dealDetails.customers?.length || 0})
                  </h3>
                  
                  {dealDetails.customers && dealDetails.customers.length > 0 ? (
                    <div className="space-y-4">
                      {dealDetails.customers.map((customer) => (
                        <Card key={customer.id} className="border-2">
                          <CardContent className="pt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  פרטי לקוח
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>שם:</strong> {customer.name}</p>
                                  <p><strong>אימייל:</strong> {customer.email || "-"}</p>
                                  <p dir="ltr" className="text-right"><strong>טלפון:</strong> {customer.phone || "-"}</p>
                                  <p><strong>תאריך הזמנה:</strong> {new Date(customer.purchasedAt).toLocaleDateString("he-IL", { 
                                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" 
                                  })}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  פרטי הזמנה
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>יחידות שהוזמנו:</strong> {customer.unitsPurchased}</p>
                                  <p><strong>מחיר ליחידה:</strong> {formatCurrency(customer.unitPricePaid)}</p>
                                  <p><strong>סה"כ לתשלום:</strong> <span className="text-lg font-bold text-primary">{formatCurrency(customer.totalPaid)}</span></p>
                                  <div>
                                    <strong>סטטוס תשלום:</strong>{" "}
                                    <Badge variant={customer.paymentStatus === "charged" ? "default" : "secondary"}>
                                      {customer.paymentStatus === "charged" ? "שולם" : customer.paymentStatus || "ממתין"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {customer.needsShipping && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                                  <Package className="h-4 w-4" />
                                  פרטי משלוח
                                </h4>
                                <div className="bg-blue-50 p-3 rounded-lg space-y-1 text-sm">
                                  <p><strong>כתובת:</strong> {customer.shippingAddress || "-"}</p>
                                  <p><strong>עיר:</strong> {customer.shippingCity || "-"}</p>
                                  <p><strong>מיקוד:</strong> {customer.shippingZipCode || "-"}</p>
                                  <p><strong>עלות משלוח:</strong> {formatCurrency(customer.shippingCost)}</p>
                                </div>
                              </div>
                            )}
                            
                            {customer.units.length > 1 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-sm mb-2">פירוט יחידות:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {customer.units.map((unit) => (
                                    <Badge key={unit.id} variant="outline">
                                      מיקום #{unit.position} - {formatCurrency(unit.pricePaid)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>אין לקוחות עדיין</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
          </TabsContent>

          <TabsContent value="completed">
            <SupplierCompletedDealsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SupplierCompletedDealsTab() {
  const { data: closedDeals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/suppliers/closed-deals"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dealsForAnalytics = closedDeals.map((deal: any) => ({
    id: deal.id,
    name: deal.name,
    participants: deal.totalParticipants,
    totalRevenue: deal.netRevenue, // Use net revenue for supplier (after commission)
    avgPrice: deal.avgPrice,
    avgUnitsPerCustomer: deal.avgUnitsPerCustomer,
    duration: deal.duration,
    category: deal.category,
    completionRate: deal.completionRate,
  }));

  return <CompletedDealsAnalytics deals={dealsForAnalytics} />;
}
