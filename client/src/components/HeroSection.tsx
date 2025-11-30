import { Button } from "@/components/ui/button";
import { Users, TrendingDown, Shield, Zap } from "lucide-react";

interface HeroSectionProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  stats?: {
    activeUsers: number;
    totalSaved: number;
    satisfaction: number;
  };
}

export default function HeroSection({ 
  onGetStarted, 
  onLearnMore,
  stats = {
    activeUsers: 2847,
    totalSaved: 4200000,
    satisfaction: 98,
  }
}: HeroSectionProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `₪${(num / 1000000).toFixed(1)}M`;
    }
    return num.toLocaleString('he-IL');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 to-background py-16 md:py-24">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>קניות קבוצתיות חכמות</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight" data-testid="hero-title">
            ביחד חוסכים
            <span className="text-primary"> יותר מתמיד</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="hero-subtitle">
            כל קונה חדש מוריד את המחיר לכולם. הנחות עד 70% על המוצרים הכי מבוקשים.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="gap-2 text-base"
              onClick={onGetStarted}
              data-testid="button-hero-cta"
            >
              <TrendingDown className="h-5 w-5" />
              לדילים הפעילים
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 text-base"
              onClick={onLearnMore}
              data-testid="button-hero-learn"
            >
              איך זה עובד?
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div 
            className="flex flex-col items-center p-6 rounded-lg bg-card border"
            data-testid="stat-active-users"
          >
            <Users className="h-8 w-8 text-primary mb-3" />
            <span className="text-3xl font-bold">{formatNumber(stats.activeUsers)}</span>
            <span className="text-sm text-muted-foreground">קונים פעילים</span>
          </div>
          
          <div 
            className="flex flex-col items-center p-6 rounded-lg bg-card border"
            data-testid="stat-total-saved"
          >
            <TrendingDown className="h-8 w-8 text-success mb-3" />
            <span className="text-3xl font-bold">{formatNumber(stats.totalSaved)}</span>
            <span className="text-sm text-muted-foreground">נחסכו החודש</span>
          </div>
          
          <div 
            className="flex flex-col items-center p-6 rounded-lg bg-card border"
            data-testid="stat-satisfaction"
          >
            <Shield className="h-8 w-8 text-warning mb-3" />
            <span className="text-3xl font-bold">{stats.satisfaction}%</span>
            <span className="text-sm text-muted-foreground">שביעות רצון</span>
          </div>
        </div>
      </div>
    </section>
  );
}
