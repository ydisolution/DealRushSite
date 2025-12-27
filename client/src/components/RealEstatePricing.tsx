import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, TrendingUp, Info, AlertCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApartmentPrice {
  type: string;
  label: string;
  priceFrom: number;
  priceRange?: string;
  featured?: boolean;
  availability?: "available" | "limited" | "soldout";
}

interface RealEstatePricingProps {
  projectName: string;
  apartmentPrices: ApartmentPrice[];
  avgDiscount?: number;
  className?: string;
  showDetailedDisclaimer?: boolean;
}

export default function RealEstatePricing({
  projectName,
  apartmentPrices,
  avgDiscount,
  className,
  showDetailedDisclaimer = true,
}: RealEstatePricingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Pricing Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            מחירים למשתתפי DealRush
            {avgDiscount && (
              <Badge className="bg-green-600 text-white mr-auto">
                <TrendingUp className="h-3 w-3 ml-1" />
                הנחה ממוצעת: {avgDiscount}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apartmentPrices.map((apt) => (
              <ApartmentPriceCard key={apt.type} apartment={apt} />
            ))}
          </div>

          {/* Starting From Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">מחירים מ-</p>
                <p>
                  המחירים המוצגים הם מחירי פתיחה למשתתפי DealRush בלבד. 
                  המחירים הסופיים עשויים להשתנות בהתאם למיקום הדירה, קומה, נוף וגימור.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      {showDetailedDisclaimer && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-5 w-5 text-yellow-800" />
          <AlertDescription className="text-sm text-yellow-900 space-y-2">
            <p className="font-bold text-base">הצהרה משפטית חשובה</p>
            <ul className="space-y-1 mr-6 list-disc">
              <li>
                <strong>DealRush אינה צד לעסקת הרכישה</strong> - אנו מספקים פלטפורמה 
                לארגון רכישה קבוצתית בלבד. העסקה מתבצעת ישירות בינך לבין היזם/קבלן.
              </li>
              <li>
                <strong>DealRush אינה ערבה למימוש העסקה</strong> - אין לנו אחריות 
                משפטית או כלכלית להשלמת הפרויקט או למימוש התנאים המוצעים.
              </li>
              <li>
                <strong>בדיקת נאותות היא באחריותך</strong> - לפני כל התחייבות כספית, 
                יש לבצע בדיקת נאותות מלאה של היזם, הפרויקט, ההיתרים והחוזים.
              </li>
              <li>
                <strong>התייעצות משפטית מומלצת</strong> - מומלץ להיוועץ בעורך דין 
                מקרקעין לפני חתימה על כל מסמך או העברת כספים.
              </li>
              <li>
                <strong>המחירים והתנאים הם ללא התחייבות</strong> - כל המחירים, ההנחות 
                והתנאים המוצגים כפופים לאישור סופי של היזם והחתימה על חוזה רשמי.
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DisclaimerCard
          icon={<Shield className="h-5 w-5" />}
          title="אבטחת מידע"
          description="הפרטים האישיים שלך מוגנים ומועברים ליזם בלבד לצורך ביצוע העסקה. לא נעשה בהם שימוש למטרות שיווק ללא הסכמתך."
          variant="blue"
        />
        <DisclaimerCard
          icon={<AlertCircle className="h-5 w-5" />}
          title="ביטול והחזרים"
          description="כל נושא של ביטול עסקה, החזר כספים או שינוי דרישות הוא בין הרוכש ליזם בלבד, בהתאם לחוזה הרכישה."
          variant="yellow"
        />
      </div>
    </div>
  );
}

function ApartmentPriceCard({ apartment }: { apartment: ApartmentPrice }) {
  const availabilityConfig = {
    available: { badge: "זמין", color: "bg-green-100 text-green-800", borderColor: "border-green-200" },
    limited: { badge: "מוגבל", color: "bg-orange-100 text-orange-800", borderColor: "border-orange-200" },
    soldout: { badge: "אזל מהמלאי", color: "bg-gray-100 text-gray-600", borderColor: "border-gray-300" },
  };

  const config = apartment.availability 
    ? availabilityConfig[apartment.availability] 
    : availabilityConfig.available;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        apartment.featured && "ring-2 ring-blue-400",
        config.borderColor
      )}
    >
      {apartment.featured && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
          מומלץ ביותר
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{apartment.label}</h3>
            {apartment.priceRange && (
              <p className="text-xs text-gray-500 mt-1">{apartment.priceRange}</p>
            )}
          </div>
          <Badge className={config.color} variant="secondary">
            {config.badge}
          </Badge>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">החל מ-</p>
            <p className="text-2xl font-bold text-blue-600" dir="ltr">
              ₪{(apartment.priceFrom || 0).toLocaleString()}
            </p>
          </div>

          {apartment.availability === "soldout" && (
            <p className="text-xs text-gray-500 italic">
              אזל מהמלאי - ניתן להירשם לרשימת המתנה
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DisclaimerCard({
  icon,
  title,
  description,
  variant = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "blue" | "yellow" | "gray";
}) {
  const variants = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900",
  };

  return (
    <div className={cn("p-4 rounded-lg border", variants[variant])}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
