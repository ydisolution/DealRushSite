import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RealEstateLegalDisclaimerProps {
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export default function RealEstateLegalDisclaimer({ 
  variant = "default",
  className = "" 
}: RealEstateLegalDisclaimerProps) {
  const disclaimerText = `DealRush אינה צד לחוזה הרכישה. רכישת הדירה והתשלום מתבצעים ישירות מול הקבלן. DealRush מצרפת רוכשים על מנת ליצור כוח קנייה ולהשיג הנחות והטבות. מחירי "מתחיל מ-" הינם לצורך המחשה בלבד. ההנחות מיושמות כאחוז ממחיר הדירה בפועל הנקבע על ידי הקבלן.`;

  if (variant === "inline") {
    return (
      <p className={`text-sm text-gray-600 border-r-4 border-[#7B2FF7] pr-3 ${className}`} dir="rtl">
        {disclaimerText}
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`bg-purple-50 border border-purple-200 rounded-lg p-3 ${className}`} dir="rtl">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[#7B2FF7] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700 leading-relaxed">
            {disclaimerText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-white border-[#7B2FF7]/30 ${className}`} dir="rtl">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="bg-[#7B2FF7] rounded-full p-2 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">הצהרה משפטית וסחרית</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {disclaimerText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
