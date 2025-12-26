import { 
  Building2, 
  Plug, 
  Sofa, 
  Smartphone, 
  Car, 
  Shirt,
  UtensilsCrossed,
  Dumbbell,
  Baby,
  Palette,
  LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export interface Category {
  id: string;
  name: string;
  icon: typeof Building2;
  color: string;
  bgGradient: string;
}

export const categories: Category[] = [
  { id: "apartments", name: "דירות מקבלן", icon: Building2, color: "text-blue-600 dark:text-blue-400", bgGradient: "from-blue-500/20 to-blue-600/10" },
  { id: "electrical", name: "מוצרי חשמל", icon: Plug, color: "text-yellow-600 dark:text-yellow-400", bgGradient: "from-yellow-500/20 to-yellow-600/10" },
  { id: "furniture", name: "ריהוט", icon: Sofa, color: "text-amber-600 dark:text-amber-400", bgGradient: "from-amber-500/20 to-amber-600/10" },
  { id: "electronics", name: "אלקטרוניקה", icon: Smartphone, color: "text-purple-600 dark:text-purple-400", bgGradient: "from-purple-500/20 to-purple-600/10" },
  { id: "automotive", name: "רכב", icon: Car, color: "text-slate-600 dark:text-slate-400", bgGradient: "from-slate-500/20 to-slate-600/10" },
  { id: "fashion", name: "אופנה", icon: Shirt, color: "text-pink-600 dark:text-pink-400", bgGradient: "from-pink-500/20 to-pink-600/10" },
  { id: "kitchen", name: "מטבח", icon: UtensilsCrossed, color: "text-orange-600 dark:text-orange-400", bgGradient: "from-orange-500/20 to-orange-600/10" },
  { id: "sports", name: "ספורט", icon: Dumbbell, color: "text-green-600 dark:text-green-400", bgGradient: "from-green-500/20 to-green-600/10" },
  { id: "baby", name: "תינוקות", icon: Baby, color: "text-cyan-600 dark:text-cyan-400", bgGradient: "from-cyan-500/20 to-cyan-600/10" },
  { id: "home", name: "עיצוב הבית", icon: Palette, color: "text-rose-600 dark:text-rose-400", bgGradient: "from-rose-500/20 to-rose-600/10" },
];

interface CategoriesProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string | undefined) => void;
  showAll?: boolean;
}

export default function Categories({ 
  selectedCategory, 
  onSelectCategory,
  showAll = true
}: CategoriesProps) {
  const [, setLocation] = useLocation();
  
  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === "apartments") {
      setLocation("/real-estate");
    } else {
      onSelectCategory?.(categoryId);
    }
  };
  
  return (
    <section className="py-8 bg-gradient-to-b from-background to-muted/20" data-testid="categories-section">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">קטגוריות</h2>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory?.(undefined)}
              className="text-sm text-primary hover:underline font-medium"
              data-testid="button-clear-category"
            >
              הצג הכל
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {showAll && (
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory?.(undefined)}
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                !selectedCategory ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
              data-testid="category-all"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                !selectedCategory 
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/30 shadow-primary/25" 
                  : "bg-gradient-to-br from-muted to-muted/50 hover:shadow-xl"
              }`}>
                <LayoutGrid className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <span className={`text-xs md:text-sm font-medium text-center transition-colors ${
                !selectedCategory ? "text-primary" : "text-muted-foreground"
              }`}>הכל</span>
            </motion.button>
          )}
          
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const Icon = category.icon;
            
            return (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                  isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                }`}
                data-testid={`category-${category.id}`}
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isSelected 
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30 shadow-primary/25" 
                    : `bg-gradient-to-br ${category.bgGradient} ${category.color} hover:shadow-xl`
                }`}>
                  <Icon className={`h-7 w-7 md:h-8 md:w-8 ${isSelected ? "" : category.color}`} />
                </div>
                <span className={`text-xs md:text-sm font-medium text-center transition-colors ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}>{category.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
