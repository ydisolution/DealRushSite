import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, TrendingDown, CheckCircle } from "lucide-react";

interface Step {
  icon: typeof Search;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Search,
    title: "בחרו דיל",
    description: "עיינו בדילים הפעילים. כל דיל כולל טיימר ומחיר דינמי שמתעדכן בזמן אמת.",
  },
  {
    icon: UserPlus,
    title: "הצטרפו",
    description: "לחצו 'הצטרף עכשיו'. המחיר נעול עבורכם - זה המחיר המקסימלי שתשלמו.",
  },
  {
    icon: TrendingDown,
    title: "צפו במחיר יורד",
    description: "ככל שיותר אנשים מצטרפים, המחיר יורד לכולם. תקבלו התראות על כל ירידה.",
  },
  {
    icon: CheckCircle,
    title: "הדיל נסגר",
    description: "כשהטיימר מגיע ל-0, כולם משלמים את המחיר הנמוך ביותר שהושג.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 bg-muted/30" data-testid="how-it-works-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="how-it-works-title">
            איך זה עובד?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ב-4 צעדים פשוטים תתחילו לחסוך כסף אמיתי
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative" data-testid={`step-${index + 1}`}>
              <CardContent className="p-6 text-center">
                <div className="absolute -top-3 right-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="w-14 h-14 mx-auto mb-4 mt-2 rounded-full bg-accent flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
