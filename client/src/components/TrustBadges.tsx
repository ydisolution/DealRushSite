import { RefreshCcw, Lock, Truck, Star } from "lucide-react";

interface TrustBadge {
  icon: typeof RefreshCcw;
  text: string;
}

const badges: TrustBadge[] = [
  { icon: RefreshCcw, text: "החזר כספי מלא עד 14 ימים" },
  { icon: Lock, text: "תשלום מאובטח SSL" },
  { icon: Truck, text: "משלוח חינם מעל ₪200" },
  { icon: Star, text: "ציון 4.9 מתוך 5" },
];

export default function TrustBadges() {
  return (
    <section className="py-8 border-t" data-testid="trust-badges-section">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 justify-center text-muted-foreground"
              data-testid={`trust-badge-${index}`}
            >
              <badge.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
