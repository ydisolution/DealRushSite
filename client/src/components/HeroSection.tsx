import { Button } from "@/components/ui/button";
import { Users, TrendingDown, Percent, Package, Zap, Sparkles, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  stats?: {
    activeBuyers: number;
    avgDiscount: number;
    openDeals: number;
  };
}

export default function HeroSection({ 
  onGetStarted, 
  onLearnMore,
  stats = {
    activeBuyers: 2847,
    avgDiscount: 35,
    openDeals: 12,
  }
}: HeroSectionProps) {

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/10 to-background py-20 md:py-28" dir="rtl">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-success/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>הפלטפורמה לקניות קבוצתיות חכמות</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight"
            data-testid="hero-title"
          >
            ביחד אנחנו
            <span className="bg-gradient-to-l from-primary via-primary to-accent bg-clip-text text-transparent"> חוסכים יותר</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="hero-subtitle"
          >
            כל קונה חדש מוריד את המחיר לכולם. 
            הצטרפו לאלפי קונים וחסכו עד <span className="font-bold text-primary">70%</span> על המוצרים הכי מבוקשים!
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button 
              size="lg" 
              className="gap-2 text-base px-8 py-6 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              onClick={onGetStarted}
              data-testid="button-hero-cta"
            >
              <ArrowDown className="h-5 w-5 animate-bounce" />
              גלו את הדילים
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2 text-base px-8 py-6 text-lg border-2"
              onClick={onLearnMore}
              data-testid="button-hero-learn"
            >
              <Zap className="h-5 w-5" />
              איך זה עובד?
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <div 
            className="group relative flex flex-col items-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            data-testid="stat-active-buyers"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <span className="text-4xl font-bold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text">
                {stats.activeBuyers.toLocaleString('he-IL')}
              </span>
              <span className="block text-sm text-muted-foreground mt-1">קונים פעילים</span>
            </div>
          </div>
          
          <div 
            className="group relative flex flex-col items-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-success/30 hover:shadow-lg hover:shadow-success/5 transition-all duration-300"
            data-testid="stat-avg-discount"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Percent className="h-7 w-7 text-success" />
              </div>
              <span className="text-4xl font-bold text-success">
                {stats.avgDiscount}%
              </span>
              <span className="block text-sm text-muted-foreground mt-1">הנחה ממוצעת</span>
            </div>
          </div>
          
          <div 
            className="group relative flex flex-col items-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            data-testid="stat-open-deals"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7 text-accent-foreground" />
              </div>
              <span className="text-4xl font-bold">
                {stats.openDeals}
              </span>
              <span className="block text-sm text-muted-foreground mt-1">דילים פתוחים</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
