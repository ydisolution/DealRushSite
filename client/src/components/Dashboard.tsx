import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  TrendingDown, 
  Package, 
  Clock, 
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Truck,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import CountdownTimer from "./CountdownTimer";

interface UserDeal {
  id: string;
  participantId?: string;
  productName: string;
  productImage: string;
  status: "active" | "completed" | "shipped";
  yourPrice: number;
  currentPrice: number;
  endTime?: Date;
  completedDate?: Date;
  savedAmount: number;
  shippingStatus?: string;
  trackingNumber?: string;
  quantity?: number;
}

interface DashboardProps {
  user: {
    name: string;
    email: string;
    phone?: string;
    totalSaved: number;
    totalOrders: number;
    avgDiscount: number;
  };
  deals: UserDeal[];
  notifications: Array<{
    id: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  onViewDeal?: (dealId: string) => void;
  onLogout?: () => void;
  onUpdateQuantity?: (participantId: string, quantity: number) => Promise<void>;
  onCancelParticipation?: (participantId: string) => Promise<void>;
}

export default function Dashboard({ 
  user, 
  deals, 
  notifications,
  onViewDeal,
  onLogout,
  onUpdateQuantity,
  onCancelParticipation
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState("active");
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [dealToCancel, setDealToCancel] = useState<UserDeal | null>(null);

  const activeDeals = deals.filter(d => d.status === "active");
  const completedDeals = deals.filter(d => d.status === "completed" || d.status === "shipped");
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleEditQuantity = async (participantId: string, quantity: number) => {
    if (!onUpdateQuantity) return;
    
    setIsLoading(true);
    try {
      await onUpdateQuantity(participantId, quantity);
      setEditingDeal(null);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelParticipation = async (deal: UserDeal) => {
    if (!onCancelParticipation || !deal.participantId) return;
    
    setIsLoading(true);
    try {
      await onCancelParticipation(deal.participantId);
      setCancelDialogOpen(false);
      setDealToCancel(null);
    } catch (error) {
      console.error("Error canceling participation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCancelDialog = (deal: UserDeal) => {
    setDealToCancel(deal);
    setCancelDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-muted/30" data-testid="dashboard" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">שלום, {user.name}!</h1>
              <p className="text-muted-foreground">{user.email}</p>
              {user.phone && <p className="text-sm text-muted-foreground">טלפון: {user.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/my-orders">
              <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                ההזמנות שלי
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="icon" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="gap-2" onClick={onLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              יציאה
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card data-testid="stat-total-saved">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ חסכתם</p>
                  <p className="text-3xl font-bold text-success">₪{user.totalSaved.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-total-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">מספר הזמנות</p>
                  <p className="text-3xl font-bold">{user.totalOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stat-avg-discount">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ממוצע חיסכון</p>
                  <p className="text-3xl font-bold">{user.avgDiscount}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              דילים פעילים
              {activeDeals.length > 0 && (
                <Badge variant="secondary" className="mr-1">{activeDeals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              היסטוריה
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              התראות
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="mr-1">{unreadNotifications}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeDeals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">אין דילים פעילים</h3>
                  <p className="text-muted-foreground mb-4">עדיין לא הצטרפתם לאף דיל</p>
                  <Button>לדילים הפעילים</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeDeals.map((deal) => (
                  <Card key={deal.id} data-testid={`active-deal-${deal.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <img 
                          src={deal.productImage} 
                          alt={deal.productName}
                          className="w-full md:w-24 h-24 object-cover rounded-md bg-muted"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Badge className="mb-2 bg-urgent/10 text-urgent border-urgent/20">
                                <Clock className="h-3 w-3 ml-1" />
                                פעיל
                              </Badge>
                              <h3 className="font-semibold">{deal.productName}</h3>
                            </div>
                            {deal.endTime && (
                              <CountdownTimer endTime={deal.endTime} size="sm" showLabels={false} />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">המחיר שלך: </span>
                              <span className="font-bold">₪{deal.yourPrice.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">המחיר הנוכחי: </span>
                              <span className={`font-bold ${deal.currentPrice < deal.yourPrice ? "text-success" : ""}`}>
                                ₪{deal.currentPrice.toLocaleString()}
                              </span>
                              {deal.currentPrice < deal.yourPrice && (
                                <span className="text-success mr-1">
                                  (חסכת עוד ₪{(deal.yourPrice - deal.currentPrice).toLocaleString()})
                                </span>
                              )}
                            </div>
                            {deal.quantity && deal.quantity > 1 && (
                              <div>
                                <span className="text-muted-foreground">כמות: </span>
                                <span className="font-bold">{deal.quantity}</span>
                              </div>
                            )}
                          </div>
                          {editingDeal === deal.participantId && (
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                type="number"
                                min="1"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(Number(e.target.value))}
                                className="w-24"
                              />
                              <Button
                                size="sm"
                                onClick={() => deal.participantId && handleEditQuantity(deal.participantId, newQuantity)}
                                disabled={isLoading}
                              >
                                שמור
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingDeal(null)}
                                disabled={isLoading}
                              >
                                ביטול
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            className="gap-2"
                            onClick={() => onViewDeal?.(deal.id)}
                          >
                            <Eye className="h-4 w-4" />
                            צפה בדיל
                          </Button>
                          {deal.participantId && editingDeal !== deal.participantId && (
                            <>
                              <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                  setEditingDeal(deal.participantId!);
                                  setNewQuantity(deal.quantity || 1);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                ערוך כמות
                              </Button>
                              <Button
                                variant="destructive"
                                className="gap-2"
                                onClick={() => openCancelDialog(deal)}
                              >
                                <Trash2 className="h-4 w-4" />
                                בטל רישום
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedDeals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">אין היסטוריה</h3>
                  <p className="text-muted-foreground">עדיין לא השלמתם אף דיל</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedDeals.map((deal) => (
                  <Card key={deal.id} data-testid={`completed-deal-${deal.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <img 
                          src={deal.productImage} 
                          alt={deal.productName}
                          className="w-full md:w-24 h-24 object-cover rounded-md bg-muted"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <Badge className={`mb-2 ${
                                deal.status === "shipped" 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}>
                                {deal.status === "shipped" ? (
                                  <>
                                    <Truck className="h-3 w-3 ml-1" />
                                    בדרך אליך
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    הושלם
                                  </>
                                )}
                              </Badge>
                              <h3 className="font-semibold">{deal.productName}</h3>
                            </div>
                            {deal.completedDate && (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(deal.completedDate)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">שילמת: </span>
                              <span className="font-bold">₪{deal.yourPrice.toLocaleString()}</span>
                            </div>
                            <div className="text-success font-medium">
                              חסכת ₪{deal.savedAmount.toLocaleString()}
                            </div>
                          </div>
                          {deal.shippingStatus && (
                            <p className="text-sm text-muted-foreground">
                              {deal.shippingStatus}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" className="gap-2">
                            פרטי הזמנה
                          </Button>
                          {deal.trackingNumber && (
                            <Button variant="ghost" className="gap-2">
                              <Truck className="h-4 w-4" />
                              עקוב אחרי משלוח
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">התראות אחרונות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-md border ${!notification.read ? "bg-accent/50" : ""}`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          !notification.read ? "bg-primary" : "bg-muted"
                        }`} />
                        <p className="text-sm">{notification.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for cancel confirmation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ביטול רישום לדיל</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך לבטל את ההרשמה לדיל "{dealToCancel?.productName}"?
              <br />
              <span className="text-destructive font-medium">פעולה זו אינה ניתנת לביטול!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={() => dealToCancel && handleCancelParticipation(dealToCancel)}
              disabled={isLoading}
            >
              {isLoading ? "מבטל..." : "אשר ביטול"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
