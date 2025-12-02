import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, TrendingDown, CheckCircle, Play, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

function AnimatedVideoPlaceholder() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10 aspect-video max-w-2xl mx-auto mb-12 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="video-placeholder"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-around opacity-20">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`flex flex-col items-center gap-2 transition-all duration-1000 ${
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <Users className="h-12 w-12 text-primary" />
              <div className="h-2 w-16 bg-primary/30 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: isHovered ? `${30 + (i * 25)}%` : '10%' }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2 text-primary/60">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">קנייה קבוצתית</span>
        </div>
        
        <div className="z-10 flex flex-col items-center gap-4">
          <div 
            className={`w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'scale-110 shadow-lg shadow-primary/30' : 'scale-100'
            }`}
          >
            <Play className="h-8 w-8 text-primary-foreground mr-[-4px]" />
          </div>
          <p className="text-lg font-medium text-foreground/80">
            צפו איך זה עובד
          </p>
          <p className="text-sm text-muted-foreground">
            סרטון הסבר - בקרוב
          </p>
        </div>
        
        <div className={`absolute bottom-4 left-4 right-4 transition-all duration-500 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-success" />
              <span>המחיר יורד</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <span>יותר משתתפים</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>כולם מרוויחים</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 bg-muted/30" data-testid="how-it-works-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="how-it-works-title">
            איך זה עובד?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ב-4 צעדים פשוטים תתחילו לחסוך כסף אמיתי
          </p>
        </div>

        <AnimatedVideoPlaceholder />

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
