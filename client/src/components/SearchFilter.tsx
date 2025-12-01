import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { id: "all", name: "כל הקטגוריות" },
  { id: "apartments", name: "דירות" },
  { id: "electrical", name: "חשמל" },
  { id: "furniture", name: "ריהוט" },
  { id: "electronics", name: "אלקטרוניקה" },
  { id: "home", name: "בית וגן" },
  { id: "fashion", name: "אופנה" },
];

interface SearchFilterProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string | undefined) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  selectedCategory?: string;
  maxPrice?: number;
}

export default function SearchFilter({ 
  onSearchChange, 
  onCategoryChange, 
  onPriceRangeChange,
  selectedCategory,
  maxPrice = 100000,
}: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    setPriceRange(prev => [
      Math.min(prev[0], maxPrice),
      maxPrice
    ]);
  }, [maxPrice]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleCategoryChange = (value: string) => {
    const category = value === "all" ? undefined : value;
    onCategoryChange(category);
    updateFilterCount(category, priceRange);
  };

  const handlePriceChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setPriceRange(range);
    onPriceRangeChange(range[0], range[1]);
    updateFilterCount(selectedCategory, range);
  };

  const updateFilterCount = (category: string | undefined, prices: [number, number]) => {
    let count = 0;
    if (category) count++;
    if (prices[0] > 0 || prices[1] < maxPrice) count++;
    setActiveFilters(count);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPriceRange([0, maxPrice]);
    onSearchChange("");
    onCategoryChange(undefined);
    onPriceRangeChange(0, maxPrice);
    setActiveFilters(0);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `₪${(price / 1000).toFixed(0)}K`;
    }
    return `₪${price}`;
  };

  return (
    <div className="bg-card rounded-lg p-4 mb-6 border" data-testid="search-filter">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש דילים..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-10"
            data-testid="input-search"
          />
        </div>

        <Select 
          value={selectedCategory || "all"} 
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-category">
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="relative"
              data-testid="button-price-filter"
            >
              <SlidersHorizontal className="h-4 w-4 ml-2" />
              טווח מחירים
              {activeFilters > 0 && (
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -left-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">טווח מחירים</h4>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </span>
              </div>
              <Slider
                min={0}
                max={maxPrice}
                step={1000}
                value={priceRange}
                onValueChange={handlePriceChange}
                className="mt-2"
                data-testid="slider-price-range"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(maxPrice)}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {(searchTerm || selectedCategory || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {(searchTerm || selectedCategory || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              חיפוש: {searchTerm}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSearchChange("")}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              קטגוריה: {CATEGORIES.find(c => c.id === selectedCategory)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleCategoryChange("all")}
              />
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              מחיר: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setPriceRange([0, maxPrice]);
                  onPriceRangeChange(0, maxPrice);
                  updateFilterCount(selectedCategory, [0, maxPrice]);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
