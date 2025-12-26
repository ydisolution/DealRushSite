import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import MicroHelp from "./MicroHelp";

const formSchema = z.object({
  fullName: z.string().min(2, "שם מלא נדרש"),
  phone: z.string().min(9, "מספר טלפון תקין נדרש"),
  email: z.string().email("אימייל תקין נדרש"),
  unitTypeInterests: z.array(z.string()).min(1, "בחר לפחות סוג דירה אחד"),
  budgetMin: z.coerce.number().min(100000, "תקציב מינימלי נדרש"),
  budgetMax: z.coerce.number().optional(),
  equityEstimate: z.coerce.number().optional(),
  hasMortgagePreApproval: z.boolean(),
  notes: z.string().optional(),
  consentMarketing: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EarlyRegistrationFormProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EarlyRegistrationForm({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: EarlyRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitTypeInterests: [],
      hasMortgagePreApproval: false,
      consentMarketing: false,
    },
  });

  const unitTypes = watch("unitTypeInterests");

  const toggleUnitType = (type: string) => {
    const current = unitTypes || [];
    if (current.includes(type)) {
      setValue("unitTypeInterests", current.filter((t) => t !== type));
    } else {
      setValue("unitTypeInterests", [...current, type]);
    }
  };

  const submitRegistration = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/real-estate/projects/${projectId}/early-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          hasMortgagePreApproval: data.hasMortgagePreApproval ? "true" : "false",
          consentMarketing: data.consentMarketing ? "true" : "false",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "שגיאה בשליחת הטופס");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ הרישום התקבל בהצלחה!",
        description: "נשלח אליך אימייל עם פרטי השלבים הבאים.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#7B2FF7]">
            רישום מוקדם לפרויקט
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => submitRegistration.mutate(data))} className="space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2">
                שם מלא *
                <MicroHelp topic="early-registration" />
              </Label>
              <Input
                id="fullName"
                {...register("fullName")}
                placeholder="שם פרטי ומשפחה"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="05X-XXXXXXX"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="example@email.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Unit Type Interests */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              סוג דירה מעניין *
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
            {errors.unitTypeInterests && (
              <p className="text-sm text-red-500 mt-1">{errors.unitTypeInterests.message}</p>
            )}
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetMin">תקציב מינימלי (₪) *</Label>
              <Input
                id="budgetMin"
                type="number"
                {...register("budgetMin")}
                placeholder="1,500,000"
                className={errors.budgetMin ? "border-red-500" : ""}
              />
              {errors.budgetMin && (
                <p className="text-sm text-red-500 mt-1">{errors.budgetMin.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="budgetMax">תקציב מקסימלי (₪)</Label>
              <Input
                id="budgetMax"
                type="number"
                {...register("budgetMax")}
                placeholder="2,000,000"
              />
            </div>
          </div>

          {/* Equity */}
          <div>
            <Label htmlFor="equityEstimate">הון עצמי משוער (₪)</Label>
            <Input
              id="equityEstimate"
              type="number"
              {...register("equityEstimate")}
              placeholder="300,000"
            />
          </div>

          {/* Mortgage Pre-Approval */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="hasMortgagePreApproval"
              onCheckedChange={(checked) => setValue("hasMortgagePreApproval", !!checked)}
            />
            <Label htmlFor="hasMortgagePreApproval" className="cursor-pointer flex items-center gap-2">
              יש לי אישור עקרוני למשכנתא
              <MicroHelp topic="no-commitment" customContent="אין חובה באישור עקרוני בשלב זה, אך מומלץ לקבל לפני הרישום הסופי" />
            </Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">הערות נוספות</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="מידע נוסף שתרצה לשתף..."
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consentMarketing"
              onCheckedChange={(checked) => setValue("consentMarketing", !!checked)}
            />
            <Label htmlFor="consentMarketing" className="cursor-pointer text-sm">
              אני מאשר/ת קבלת עדכונים ופרסומות בנוגע לפרויקט זה ולפרויקטים דומים
            </Label>
          </div>

          {/* Disclaimer */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">שים לב:</p>
              <p>
                רישום זה אינו מהווה התחייבות משפטית. DealRush אינה צד לעסקת הרכישה.
                הבחירה והחתימה מתבצעות ישירות מול הקבלן.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitRegistration.isPending}
              className="flex-1 bg-[#7B2FF7] hover:bg-purple-700"
            >
              {submitRegistration.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  שולח...
                </>
              ) : (
                "שלח רישום מוקדם"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
