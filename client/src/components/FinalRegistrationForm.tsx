import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import MicroHelp from "./MicroHelp";

const formSchema = z.object({
  confirmedUnitTypes: z.array(z.string()).min(1, "יש לאשר לפחות סוג דירה אחד"),
  confirmedBudgetMin: z.coerce.number().min(100000, "תקציב מינימלי נדרש"),
  confirmedBudgetMax: z.coerce.number().optional(),
  consentDataTransfer: z.boolean().refine((val) => val === true, {
    message: "חובה לאשר העברת מידע כדי להמשיך",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface FinalRegistrationFormProps {
  projectId: string;
  registrationId: string;
  countdown: number; // seconds remaining
  existingData?: {
    unitTypeInterests: string[];
    budgetMin?: number;
    budgetMax?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FinalRegistrationForm({
  projectId,
  registrationId,
  countdown,
  existingData,
  isOpen,
  onClose,
  onSuccess,
}: FinalRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(countdown);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      confirmedUnitTypes: existingData?.unitTypeInterests || [],
      confirmedBudgetMin: existingData?.budgetMin,
      confirmedBudgetMax: existingData?.budgetMax,
      consentDataTransfer: false,
    },
  });

  const unitTypes = watch("confirmedUnitTypes");
  const consentDataTransfer = watch("consentDataTransfer");

  useEffect(() => {
    if (countdown > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countdown]);

  const toggleUnitType = (type: string) => {
    const current = unitTypes || [];
    if (current.includes(type)) {
      setValue("confirmedUnitTypes", current.filter((t) => t !== type));
    } else {
      setValue("confirmedUnitTypes", [...current, type]);
    }
  };

  const submitFinalRegistration = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/real-estate/projects/${projectId}/final-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          consentDataTransfer: data.consentDataTransfer,
          confirmedBudget: {
            min: data.confirmedBudgetMin,
            max: data.confirmedBudgetMax,
          },
          confirmedUnitTypes: data.confirmedUnitTypes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "שגיאה בשליחת הרישום הסופי");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "🎉 הרישום הסופי הושלם!",
        description: "נעביר את פרטיך לקבלן ולעו\"ד ספיר. הם יצרו איתך קשר בקרוב.",
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isUrgent = timeLeft < 3600; // Less than 1 hour
  const isCritical = timeLeft < 600; // Less than 10 minutes

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-600">
            רישום לרכישה - חלון מוגבל!
          </DialogTitle>
        </DialogHeader>

        {/* Countdown Banner */}
        <div
          className={`p-4 rounded-lg border-2 ${
            isCritical
              ? "bg-red-50 border-red-300"
              : isUrgent
              ? "bg-orange-50 border-orange-300"
              : "bg-yellow-50 border-yellow-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock
                className={`h-6 w-6 ${
                  isCritical ? "text-red-600 animate-pulse" : isUrgent ? "text-orange-600" : "text-yellow-600"
                }`}
              />
              <div>
                <p className="font-bold text-lg">{formatTime(timeLeft)}</p>
                <p className="text-sm text-gray-600">זמן נותר לרישום</p>
              </div>
            </div>
            <AlertTriangle
              className={`h-8 w-8 ${
                isCritical ? "text-red-600" : isUrgent ? "text-orange-600" : "text-yellow-600"
              }`}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => submitFinalRegistration.mutate(data))} className="space-y-6">
          {/* What This Means */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">מה זה אומר?</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>הפרטים שלך יועברו לקבלן ולעו"ד ספיר</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>תקבל קריאה לתיאום בחירת דירה ספציפית</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>זה עדיין לא התחייבות משפטית - החוזה ייחתם אצל הקבלן</span>
              </li>
            </ul>
          </div>

          {/* Confirm Unit Types */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              אישור סוגי דירות מעניינים *
              <MicroHelp topic="apartment-selection" />
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {["3 חדרים", "4 חדרים", "5 חדרים"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={unitTypes?.includes(type) ? "default" : "outline"}
                  onClick={() => toggleUnitType(type)}
                  className={unitTypes?.includes(type) ? "bg-[#7B2FF7]" : ""}
                >
                  {type}
                </Button>
              ))}
            </div>
            {errors.confirmedUnitTypes && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmedUnitTypes.message}</p>
            )}
          </div>

          {/* Confirm Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="confirmedBudgetMin">תקציב מינימלי (₪) *</Label>
              <Input
                id="confirmedBudgetMin"
                type="number"
                {...register("confirmedBudgetMin")}
                placeholder="1,500,000"
                className={errors.confirmedBudgetMin ? "border-red-500" : ""}
              />
              {errors.confirmedBudgetMin && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmedBudgetMin.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmedBudgetMax">תקציב מקסימלי (₪)</Label>
              <Input
                id="confirmedBudgetMax"
                type="number"
                {...register("confirmedBudgetMax")}
                placeholder="2,000,000"
              />
            </div>
          </div>

          {/* Consent - CRITICAL */}
          <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consentDataTransfer"
                checked={consentDataTransfer}
                onCheckedChange={(checked) => setValue("consentDataTransfer", !!checked)}
              />
              <div>
                <Label htmlFor="consentDataTransfer" className="cursor-pointer font-semibold text-orange-900">
                  אני מאשר/ת את העברת הפרטים שלי *
                </Label>
                <p className="text-sm text-orange-800 mt-1">
                  אני מאשר/ת את העברת הפרטים שלי לקבלן ולעו"ד ספיר לצורך המשך התהליך.
                  אני מבין/ה שזו אינה התחייבות משפטית וכי החוזה ייחתם ישירות עם הקבלן.
                </p>
              </div>
            </div>
            {errors.consentDataTransfer && (
              <p className="text-sm text-red-500 mt-2">{errors.consentDataTransfer.message}</p>
            )}
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">הצהרה חשובה:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>רישום זה אינו מהווה התחייבות משפטית או חוזה</li>
              <li>DealRush אינה צד לעסקת הרכישה</li>
              <li>בחירת הדירה והחתימה נעשות ישירות עם הקבלן</li>
              <li>ניתן לחזור בך בכל עת עד לחתימה על חוזה עם הקבלן</li>
              <li>עו"ד ספיר מייצגת את הרוכשים ולא את הקבלן או DealRush</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitFinalRegistration.isPending || timeLeft <= 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitFinalRegistration.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מאשר...
                </>
              ) : timeLeft <= 0 ? (
                "חלון הרישום נסגר"
              ) : (
                "אשר רישום סופי"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitFinalRegistration.isPending}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
