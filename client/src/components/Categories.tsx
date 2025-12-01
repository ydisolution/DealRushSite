import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export interface Category {
  id: string;
  name: string;
  icon: typeof Building2;
  count?: number;
  color: string;
}

export const categories: Category[] = [
  { id: "apartments", name: "דירות מקבלן", icon: Building2, count: 3, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { id: "electrical", name: "מוצרי חשמל", icon: Plug, count: 12, color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  { id: "furniture", name: "ריהוט", icon: Sofa, count: 8, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { id: "electronics", name: "אלקטרוניקה", icon: Smartphone, count: 15, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { id: "automotive", name: "רכב", icon: Car, count: 5, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  { id: "fashion", name: "אופנה", icon: Shirt, count: 7, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { id: "kitchen", name: "מטבח", icon: UtensilsCrossed, count: 9, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { id: "sports", name: "ספורט", icon: Dumbbell, count: 6, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { id: "baby", name: "תינוקות", icon: Baby, count: 4, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { id: "home", name: "עיצוב הבית", icon: Palette, count: 11, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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
  return (
    <section className="py-6 bg-muted/30" data-testid="categories-section">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">קטגוריות</h2>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory?.(undefined)}
              className="text-sm text-primary hover:underline"
              data-testid="button-clear-category"
            >
              הצג הכל
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-11 gap-2">
          {showAll && (
            <button
              onClick={() => onSelectCategory?.(undefined)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                !selectedCategory 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-background hover-elevate border"
              }`}
              data-testid="category-all"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                !selectedCategory ? "bg-primary-foreground/20" : "bg-muted"
              }`}>
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-center">הכל</span>
            </button>
          )}
          
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const Icon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory?.(category.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-background hover-elevate border"
                }`}
                data-testid={`category-${category.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSelected ? "bg-primary-foreground/20" : category.color
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
                {category.count && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {category.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
