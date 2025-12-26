import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Loader2, CheckCircle } from "lucide-react";

interface EventRSVPFormProps {
  projectId: string;
  registrationId: string;
  eventData?: {
    eventType: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    joinLink?: string;
    speakersDealRush?: string;
    speakersDeveloper?: string;
    speakersAttorney?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EventRSVPForm({
  projectId,
  registrationId,
  eventData,
  isOpen,
  onClose,
  onSuccess,
}: EventRSVPFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmRSVP = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/real-estate/projects/${projectId}/event-rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "שגיאה באישור ההגעה");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ אישור הגעה נרשם!",
        description: "נשלח אליך אימייל עם פרטי האירוע והזמנה ליומן.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/real-estate/projects/${projectId}/my-status`] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "❌ שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const eventType = eventData?.eventType === "webinar" ? "וובינר" : "אירוע פיזי";
  const eventDateFormatted = eventData?.eventDate
    ? new Date(eventData.eventDate).toLocaleDateString("he-IL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#7B2FF7]">
            הצגת הפרויקט - אישור הגעה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg border">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#7B2FF7] mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">מתי?</p>
                  <p className="text-gray-700">
                    {eventDateFormatted}
                    {eventData?.eventTime && ` בשעה ${eventData.eventTime}`}
                  </p>
                </div>
              </div>

              {eventData?.eventType === "physical" && eventData?.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#7B2FF7] mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">איפה?</p>
                    <p className="text-gray-700">{eventData.location}</p>
                  </div>
                </div>
              )}

              {eventData?.eventType === "webinar" && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-[#7B2FF7] mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">סוג האירוע</p>
                    <p className="text-gray-700">וובינר מקוון - הקישור יישלח במייל לאחר האישור</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What to Expect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">מה כולל האירוע?</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  הסבר על התהליך והמבנה של DealRush
                  {eventData?.speakersDealRush && ` - ${eventData.speakersDealRush}`}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  הצגת הפרויקט על ידי הקבלן
                  {eventData?.speakersDeveloper && ` - ${eventData.speakersDeveloper}`}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  הסבר משפטי על המסגרת החוקית - {eventData?.speakersAttorney || 'עו"ד ספיר'}
                </p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">חשוב לדעת:</span> ההשתתפות במצגת אינה מחייבת. זו הזדמנות
              לקבל מידע מפורט על הפרויקט ועל התהליך לפני קבלת החלטה.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => confirmRSVP.mutate()}
              disabled={confirmRSVP.isPending}
              className="flex-1 bg-[#7B2FF7] hover:bg-purple-700"
            >
              {confirmRSVP.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מאשר...
                </>
              ) : (
                "אשר הגעה"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={confirmRSVP.isPending}>
              אחזור בהמשך
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
