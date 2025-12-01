import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  UserPlus, 
  TrendingDown, 
  CheckCircle, 
  Users,
  Clock,
  ShieldCheck,
  Zap
} from "lucide-react";

interface HowItWorksPageProps {
  onGetStarted?: () => void;
}

export default function HowItWorksPage({ onGetStarted }: HowItWorksPageProps) {
  const steps = [
    {
      icon: Search,
      title: "בחרו דיל",
      description: "עיינו בדילים הפעילים. כל דיל כולל טיימר ומחיר דינמי שמתעדכן בזמן אמת. ראו את המחיר הנוכחי ואת הפוטנציאל לחיסכון.",
    },
    {
      icon: UserPlus,
      title: "הצטרפו לדיל",
      description: 'לחצו "הצטרף עכשיו". המחיר נעול עבורכם - זה המחיר המקסימלי שתשלמו. אם המחיר ימשיך לרדת, אתם משלמים פחות!',
    },
    {
      icon: TrendingDown,
      title: "צפו במחיר יורד",
      description: "ככל שיותר אנשים מצטרפים, המחיר יורד. תקבלו התראות כשהמחיר יורד. אתם יכולים לראות בזמן אמת כמה אנשים הצטרפו.",
    },
    {
      icon: CheckCircle,
      title: "הדיל נסגר",
      description: "כשהטיימר מגיע ל-0, הדיל נסגר. כולם משלמים את המחיר הנמוך ביותר שהושג. המוצר נשלח אליכם תוך 3-5 ימי עסקים.",
    },
  ];

  const priceExample = [
    { participants: 1, price: 5850, discount: 10 },
    { participants: 10, price: 5525, discount: 15 },
    { participants: 50, price: 4875, discount: 25 },
    { participants: 100, price: 4225, discount: 35 },
  ];

  const faqs = [
    {
      question: "מה קורה אם לא מגיעים למספר המינימלי?",
      answer: "אין מספר מינימלי! הדיל מתבצע גם עם משתמש אחד. פשוט ההנחה קטנה יותר.",
    },
    {
      question: "האם יש מלאי מוגבל?",
      answer: "לא! אנחנו מתחייבים לספק את המוצר לכל מי שהצטרף עד סגירת הדיל.",
    },
    {
      question: "מתי אני משלם?",
      answer: "אתם משלמים רק כשהדיל נסגר, במחיר הנמוך ביותר שהושג.",
    },
    {
      question: "מה אם המוצר לא מתאים לי?",
      answer: "החזר כספי מלא עד 14 ימים, בלי שאלות.",
    },
    {
      question: "האם המוצרים אמיתיים/מקוריים?",
      answer: "כן! כל המוצרים מקוריים עם אחריות יצרן מלאה.",
    },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="how-it-works-page">
      <section className="py-16 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            קניות קבוצתיות חכמות
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            איך <span className="text-primary">DealRush</span> עובד?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            קניות קבוצתיות שחוסכות לכם כסף אמיתי. ככל שיותר אנשים קונים, המחיר יורד לכולם!
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-muted/30 h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  מחיר ראשוני
                </h3>
                <p className="text-muted-foreground flex-1">
                  אתם משלמים מחיר קבוע, בין אם אתם הקונה היחיד או אחד מבין אלפים. אין שום יתרון לקנייה קבוצתית.
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5 h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  ב-DealRush
                </h3>
                <p className="text-foreground flex-1">
                  ככל שיותר אנשים קונים, המחיר יורד לכולם! כולם משלמים את המחיר הנמוך ביותר שהושג.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            דוגמה למחיר דינמי
          </h2>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">טלוויזיה Samsung 65"</p>
                <p className="text-lg">
                  מחיר ראשוני: <span className="font-bold">₪6,500</span>
                </p>
              </div>
              <div className="space-y-3">
                {priceExample.map((tier, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(tier.participants, 3) }).map((_, i) => (
                          <Users key={i} className="h-4 w-4 text-primary" />
                        ))}
                      </div>
                      <span className="text-sm">
                        {tier.participants === 1 ? "אדם ראשון" : `${tier.participants} אנשים`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-success font-medium">
                        {tier.discount}% הנחה
                      </span>
                      <span className="font-bold text-lg">
                        ₪{tier.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            שלב אחר שלב
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="relative" data-testid={`step-detail-${index + 1}`}>
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

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            שאלות נפוצות
          </h2>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-card border rounded-md px-4"
                  data-testid={`faq-${index}`}
                >
                  <AccordionTrigger className="text-right hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            מוכנים להתחיל לחסוך?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            הצטרפו לאלפי הקונים שכבר חוסכים עם DealRush
          </p>
          <Button size="lg" className="gap-2" onClick={onGetStarted} data-testid="button-start-now">
            <ShieldCheck className="h-5 w-5" />
            לדילים הפעילים
          </Button>
        </div>
      </section>
    </div>
  );
}
