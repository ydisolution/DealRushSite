import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Clock, 
  Users,
  Link as LinkIcon,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebinarAdminProps {
  projectId: number;
  projectSlug: string;
  projectName: string;
  currentWebinarDate?: string | null;
  currentWebinarLink?: string | null;
  preRegisteredCount: number;
  webinarInvitesSent: boolean;
  className?: string;
}

export default function RealEstateWebinarAdmin({
  projectId,
  projectSlug,
  projectName,
  currentWebinarDate,
  currentWebinarLink,
  preRegisteredCount,
  webinarInvitesSent,
  className,
}: WebinarAdminProps) {
  const queryClient = useQueryClient();
  const [webinarDate, setWebinarDate] = useState(
    currentWebinarDate ? new Date(currentWebinarDate).toISOString().slice(0, 16) : ""
  );
  const [webinarLink, setWebinarLink] = useState(currentWebinarLink || "");
  const [customMessage, setCustomMessage] = useState("");

  // Update webinar details mutation
  const updateWebinarMutation = useMutation({
    mutationFn: async (data: { webinarDate: string; webinarLink: string }) => {
      const res = await fetch(`/api/real-estate/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webinarDate: data.webinarDate,
          webinarLink: data.webinarLink,
        }),
      });
      if (!res.ok) throw new Error("Failed to update webinar details");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/real-estate/projects/${projectSlug}`] });
    },
  });

  // Send webinar invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/real-estate/projects/${projectSlug}/send-webinar-invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customMessage }),
        }
      );
      if (!res.ok) throw new Error("Failed to send invitations");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/real-estate/projects/${projectSlug}`] });
    },
  });

  // Close registration mutation
  const closeRegistrationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/real-estate/projects/${projectSlug}/close-registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Failed to close registration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/real-estate/projects/${projectSlug}`] });
    },
  });

  const handleUpdateWebinar = () => {
    if (!webinarDate || !webinarLink) {
      alert("יש למלא תאריך וקישור לווביניר");
      return;
    }
    updateWebinarMutation.mutate({ webinarDate, webinarLink });
  };

  const handleSendInvitations = () => {
    if (!currentWebinarDate || !currentWebinarLink) {
      alert("יש להגדיר תאריך וקישור לווביניר לפני שליחת הזמנות");
      return;
    }
    if (preRegisteredCount === 0) {
      alert("אין משתתפים רשומים");
      return;
    }
    if (
      !confirm(
        `האם לשלוח הזמנות ווביניר ל-${preRegisteredCount} משתתפים?\n` +
        `זה ישלח התראות דרך Email, WhatsApp ו-SMS לכל הנרשמים.`
      )
    ) {
      return;
    }
    sendInvitationsMutation.mutate();
  };

  const handleCloseRegistration = () => {
    if (
      !confirm(
        "האם לסגור את ההרשמה לפרויקט?\n" +
        "פעולה זו תשלח התראות לכל המשתתפים ותמנע הרשמות חדשות."
      )
    ) {
      return;
    }
    closeRegistrationMutation.mutate();
  };

  const isWebinarConfigured = currentWebinarDate && currentWebinarLink;
  const canSendInvitations = isWebinarConfigured && preRegisteredCount > 0 && !webinarInvitesSent;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="נרשמים מראש"
          value={preRegisteredCount}
          color="blue"
        />
        <StatCard
          icon={<Video className="h-5 w-5" />}
          label="סטטוס ווביניר"
          value={isWebinarConfigured ? "מוגדר" : "לא הוגדר"}
          color={isWebinarConfigured ? "green" : "gray"}
        />
        <StatCard
          icon={<Send className="h-5 w-5" />}
          label="הזמנות נשלחו"
          value={webinarInvitesSent ? "כן" : "לא"}
          color={webinarInvitesSent ? "green" : "yellow"}
        />
      </div>

      {/* Webinar Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            הגדרות ווביניר
          </CardTitle>
          <CardDescription>
            הגדר תאריך וקישור לווביניר שיישלח למשתתפים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webinarDate">תאריך ושעת הווביניר</Label>
            <Input
              id="webinarDate"
              type="datetime-local"
              value={webinarDate}
              onChange={(e) => setWebinarDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="webinarLink">קישור לווביניר (Zoom/Google Meet)</Label>
            <div className="flex gap-2 mt-1">
              <LinkIcon className="h-4 w-4 text-gray-400 mt-3" />
              <Input
                id="webinarLink"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={webinarLink}
                onChange={(e) => setWebinarLink(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateWebinar}
            disabled={updateWebinarMutation.isPending || !webinarDate || !webinarLink}
            className="w-full"
          >
            {updateWebinarMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 ml-2" />
                שמור הגדרות ווביניר
              </>
            )}
          </Button>

          {updateWebinarMutation.isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                הגדרות הווביניר נשמרו בהצלחה
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Send Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            שליחת הזמנות לווביניר
          </CardTitle>
          <CardDescription>
            שלח הזמנות Email, WhatsApp ו-SMS לכל המשתתפים שנרשמו מראש
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isWebinarConfigured && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                יש להגדיר תאריך וקישור לווביניר לפני שליחת הזמנות
              </AlertDescription>
            </Alert>
          )}

          {preRegisteredCount === 0 && (
            <Alert className="bg-gray-50 border-gray-200">
              <Users className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-800">
                אין משתתפים רשומים עדיין
              </AlertDescription>
            </Alert>
          )}

          {webinarInvitesSent && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                הזמנות לווביניר כבר נשלחו למשתתפים
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="customMessage">הודעה מותאמת אישית (אופציונלי)</Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="הוסף הודעה אישית שתישלח יחד עם ההזמנה..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              ההודעה תתווסף לטקסט סטנדרטי של ההזמנה
            </p>
          </div>

          <Button
            onClick={handleSendInvitations}
            disabled={!canSendInvitations || sendInvitationsMutation.isPending}
            className="w-full"
            variant={canSendInvitations ? "default" : "secondary"}
          >
            {sendInvitationsMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-spin" />
                שולח הזמנות...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 ml-2" />
                שלח הזמנות ל-{preRegisteredCount} משתתפים
              </>
            )}
          </Button>

          {sendInvitationsMutation.isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ההזמנות נשלחו בהצלחה ל-{preRegisteredCount} משתתפים
              </AlertDescription>
            </Alert>
          )}

          {sendInvitationsMutation.isError && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                שגיאה בשליחת ההזמנות: {sendInvitationsMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Close Registration */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            סגירת הרשמה
          </CardTitle>
          <CardDescription>
            סגור את ההרשמה לפרויקט ושלח הודעה לכל המשתתפים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-50 border-red-200 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>אזהרה:</strong> פעולה זו תסגור את האפשרות להרשמות חדשות 
              ותשלח התראות סיכום לכל המשתתפים.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleCloseRegistration}
            disabled={closeRegistrationMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {closeRegistrationMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-spin" />
                סוגר הרשמה...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 ml-2" />
                סגור הרשמה ושלח התראות
              </>
            )}
          </Button>

          {closeRegistrationMutation.isSuccess && (
            <Alert className="bg-green-50 border-green-200 mt-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ההרשמה נסגרה והתראות נשלחו למשתתפים
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "gray";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900",
  };

  return (
    <Card className={cn("border", colors[color])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">{icon}</div>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
