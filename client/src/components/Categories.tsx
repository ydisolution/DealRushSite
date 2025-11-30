import { Button } from "@/components/ui/button";
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
  Palette
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: typeof Building2;
  count?: number;
}

export const categories: Category[] = [
  { id: "apartments", name: "דירות מקבלן", icon: Building2, count: 3 },
  { id: "electrical", name: "מוצרי חשמל", icon: Plug, count: 12 },
  { id: "furniture", name: "ריהוט", icon: Sofa, count: 8 },
  { id: "electronics", name: "אלקטרוניקה", icon: Smartphone, count: 15 },
  { id: "automotive", name: "רכב", icon: Car, count: 5 },
  { id: "fashion", name: "אופנה", icon: Shirt, count: 7 },
  { id: "kitchen", name: "מטבח", icon: UtensilsCrossed, count: 9 },
  { id: "sports", name: "ספורט", icon: Dumbbell, count: 6 },
  { id: "baby", name: "תינוקות", icon: Baby, count: 4 },
  { id: "home", name: "עיצוב הבית", icon: Palette, count: 11 },
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
    <section className="py-6 border-b" data-testid="categories-section">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {showAll && (
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => onSelectCategory?.(undefined)}
              data-testid="category-all"
            >
              הכל
            </Button>
          )}
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => onSelectCategory?.(category.id)}
              data-testid={`category-${category.id}`}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
              {category.count && (
                <span className="text-xs opacity-70">({category.count})</span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
