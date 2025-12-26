import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Video,
} from "lucide-react";
import RealEstatePreRegister from "./RealEstatePreRegister";
import RealEstateConfirmParticipation from "./RealEstateConfirmParticipation";
import RealEstateFOMOCountdown from "./RealEstateFOMOCountdown";
import RealEstateParticipantsList from "./RealEstateParticipantsList";
import RealEstatePricing from "./RealEstatePricing";
import RealEstateWebinarAdmin from "./RealEstateWebinarAdmin";

interface RealEstateProjectManagerProps {
  projectSlug: string;
}

export default function RealEstateProjectManager({ projectSlug }: RealEstateProjectManagerProps) {
  const { user } = useUser();

  const { data: project, isLoading } = useQuery<any>({
    queryKey: [`/api/real-estate/projects/${projectSlug}`],
  });

  const { data: myRegistration } = useQuery<any>({
    queryKey: [`/api/real-estate/projects/${projectSlug}/my-registration`],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">טוען פרטי פרויקט...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          לא נמצאו פרטים על הפרויקט
        </AlertDescription>
      </Alert>
    );
  }

  // Parse project data
  const {
    id,
    title,
    currentStage,
    totalCapacity,
    currentRegistrantCount,
    waitingListCapacity,
    currentWaitingListCount,
    finalRegistrationEnd,
    webinarDate,
    webinarLink,
    webinarInvitesSent,
    propertyTypes,
    marketPriceBaseline,
  } = project;

  // Determine user's funnel status
  const userStatus = myRegistration?.funnelStatus;
  const isAdmin = user?.role === "admin" || user?.role === "supplier";

  // Pricing data for display
  const apartmentPrices = propertyTypes?.map((pt: any) => ({
    type: pt.type,
    label: getApartmentLabel(pt.type),
    priceFrom: pt.startingFromPrice,
    availability: pt.count > 0 ? "available" : "soldout",
  })) || [];

  const avgDiscount = project.tiers?.[project.tiers.length - 1]?.savingsPercent;

  return (
    <div className="space-y-6">
      {/* Stage Status Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                שלב נוכחי: {getStageLabel(currentStage)}
              </p>
            </div>
            <Badge className={getStageBadgeClass(currentStage)}>
              {getStageLabel(currentStage)}
            </Badge>
          </div>

          {/* User Status */}
          {myRegistration && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>הסטטוס שלך:</strong> {getFunnelStatusLabel(userStatus)}
                {myRegistration.queuePosition && (
                  <span className="mr-2">• תור {myRegistration.queuePosition}</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Admin Panel */}
      {isAdmin && (
        <RealEstateWebinarAdmin
          projectId={id}
          projectSlug={projectSlug}
          projectName={title}
          currentWebinarDate={webinarDate}
          currentWebinarLink={webinarLink}
          preRegisteredCount={currentRegistrantCount}
          webinarInvitesSent={webinarInvitesSent}
        />
      )}

      {/* Stage-Based Content */}
      {currentStage === "PRE_REGISTRATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Registration Form */}
          <div className="space-y-6">
            {!myRegistration && <RealEstatePreRegister projectSlug={projectSlug} />}
            {myRegistration && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    נרשמת בהצלחה!
                  </h3>
                  <p className="text-green-800">
                    תקבל הזמנה לווביניר בהקדם
                  </p>
                </CardContent>
              </Card>
            )}

            <RealEstatePricing
              projectName={title}
              apartmentPrices={apartmentPrices}
              avgDiscount={avgDiscount}
              showDetailedDisclaimer={false}
            />
          </div>

          {/* Right: Participants List */}
          <RealEstateParticipantsList projectSlug={projectSlug} showWaitingList={false} />
        </div>
      )}

      {currentStage === "WEBINAR_SCHEDULED" && (
        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Video className="h-8 w-8 text-blue-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    הווביניר מתקרב!
                  </h3>
                  <p className="text-blue-800 mb-3">
                    תאריך: {new Date(webinarDate).toLocaleDateString("he-IL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {webinarLink && (
                    <a
                      href={webinarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      קישור לווביניר
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <RealEstateParticipantsList projectSlug={projectSlug} showWaitingList={false} />
        </div>
      )}

      {currentStage === "FOMO_CONFIRMATION_WINDOW" && (
        <div className="space-y-6">
          {/* Countdown + Capacity */}
          <RealEstateFOMOCountdown
            endDate={new Date(finalRegistrationEnd)}
            totalCapacity={totalCapacity}
            currentCount={currentRegistrantCount}
            waitingListCapacity={waitingListCapacity}
            waitingListCount={currentWaitingListCount}
          />

          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">אישור השתתפות</TabsTrigger>
              <TabsTrigger value="participants">רשימת משתתפים</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-6">
              {!myRegistration && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    לא נרשמת מראש לפרויקט זה. רק משתתפים רשומים יכולים לאשר השתתפות.
                  </AlertDescription>
                </Alert>
              )}

              {myRegistration && userStatus === "PRE_REGISTERED" && (
                <RealEstateConfirmParticipation projectSlug={projectSlug} />
              )}

              {myRegistration && (userStatus === "CONFIRMED" || userStatus === "WAITING_LIST") && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">
                      אישרת השתתפות!
                    </h3>
                    <p className="text-green-800">
                      מיקומך בתור: {myRegistration.queuePosition}
                    </p>
                    {userStatus === "WAITING_LIST" && (
                      <Badge className="mt-3 bg-yellow-100 text-yellow-800">
                        רשימת המתנה
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="participants">
              <RealEstateParticipantsList projectSlug={projectSlug} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {currentStage === "REGISTRATION_CLOSED" && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              ההרשמה נסגרה
            </h3>
            <p className="text-gray-600">
              הפרויקט הזה אינו פתוח להרשמות חדשות
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    PRE_REGISTRATION: "הרשמה מוקדמת",
    WEBINAR_SCHEDULED: "ממתינים לווביניר",
    FOMO_CONFIRMATION_WINDOW: "חלון אישור FIFO",
    REGISTRATION_CLOSED: "ההרשמה נסגרה",
    OFFER_APPROVED: "הצעה אושרה",
    CONTRACT_SENT: "חוזה נשלח",
  };
  return labels[stage] || stage;
}

function getStageBadgeClass(stage: string): string {
  const classes: Record<string, string> = {
    PRE_REGISTRATION: "bg-blue-500",
    WEBINAR_SCHEDULED: "bg-purple-500",
    FOMO_CONFIRMATION_WINDOW: "bg-orange-500",
    REGISTRATION_CLOSED: "bg-gray-500",
    OFFER_APPROVED: "bg-green-500",
    CONTRACT_SENT: "bg-teal-500",
  };
  return classes[stage] || "bg-gray-500";
}

function getFunnelStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PRE_REGISTERED: "נרשמת מראש",
    WEBINAR_INVITED: "הוזמנת לווביניר",
    CONFIRMED: "אישרת השתתפות",
    WAITING_LIST: "ברשימת המתנה",
    APPROVED: "אושרת לרכישה",
    CONTRACT_SENT: "חוזה נשלח",
    COMPLETED: "עסקה הושלמה",
  };
  return labels[status] || status;
}

function getApartmentLabel(type: string): string {
  const labels: Record<string, string> = {
    "2_ROOM": "2 חדרים",
    "3_ROOM": "3 חדרים",
    "4_ROOM": "4 חדרים",
    "5_ROOM": "5 חדרים",
    "PENTHOUSE": "פנטהאוז",
    "GARDEN": "דירת גן",
  };
  return labels[type] || type;
}
