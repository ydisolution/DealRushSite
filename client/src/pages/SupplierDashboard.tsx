import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Send
} from "lucide-react";
import { Link } from "wouter";

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
  purchasedAt: Date;
  paymentStatus: string | null;
  chargedAmount: number | null;
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
  const [selectedDeal, setSelectedDeal] = useState<DealDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">דשבורד ספק</h1>
            <p className="text-muted-foreground mt-1">נהל את הדילים שלך וצפה בסטטיסטיקות</p>
          </div>
          <Link href="/supplier/deals/new">
            <Button data-testid="button-create-deal">
              <Plus className="h-4 w-4 ml-2" />
              צור דיל חדש
            </Button>
          </Link>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">שם</TableHead>
                          <TableHead className="text-right">אימייל</TableHead>
                          <TableHead className="text-right">טלפון</TableHead>
                          <TableHead className="text-right">יחידות</TableHead>
                          <TableHead className="text-right">מחיר ליחידה</TableHead>
                          <TableHead className="text-right">סטטוס תשלום</TableHead>
                          <TableHead className="text-right">תאריך רכישה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dealDetails.customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>{customer.name}</TableCell>
                            <TableCell>{customer.email || "-"}</TableCell>
                            <TableCell dir="ltr" className="text-right">{customer.phone || "-"}</TableCell>
                            <TableCell>{customer.unitsPurchased}</TableCell>
                            <TableCell>{formatCurrency(customer.unitPricePaid)}</TableCell>
                            <TableCell>
                              <Badge variant={customer.paymentStatus === "charged" ? "default" : "secondary"}>
                                {customer.paymentStatus === "charged" ? "שולם" : customer.paymentStatus || "ממתין"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(customer.purchasedAt).toLocaleDateString("he-IL")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
      </div>
    </div>
  );
}
