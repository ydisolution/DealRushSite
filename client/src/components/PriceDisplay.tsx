import { Badge } from "@/components/ui/badge";

interface PriceDisplayProps {
  originalPrice: number;
  currentPrice: number;
  size?: "sm" | "md" | "lg";
  showSavings?: boolean;
  currency?: string;
}

export default function PriceDisplay({ 
  originalPrice, 
  currentPrice, 
  size = "md",
  showSavings = true,
  currency = "₪"
}: PriceDisplayProps) {
  const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  const savings = originalPrice - currentPrice;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL').format(price);
  };

  const sizeClasses = {
    sm: {
      original: "text-sm",
      current: "text-xl font-bold",
      badge: "text-xs",
    },
    md: {
      original: "text-base",
      current: "text-3xl font-bold",
      badge: "text-sm",
    },
    lg: {
      original: "text-lg",
      current: "text-4xl font-black",
      badge: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col gap-1" data-testid="price-display">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`${classes.current} text-primary`} data-testid="current-price">
          {currency}{formatPrice(currentPrice)}
        </span>
        <span 
          className={`${classes.original} text-muted-foreground line-through`}
          data-testid="original-price"
        >
          {currency}{formatPrice(originalPrice)}
        </span>
        <Badge 
          variant="secondary" 
          className="bg-success/10 text-success border-success/20"
          data-testid="discount-badge"
        >
          -{discount}%
        </Badge>
      </div>
      {showSavings && (
        <p className="text-sm text-success font-medium" data-testid="savings-amount">
          חוסכים {currency}{formatPrice(savings)}
        </p>
      )}
    </div>
  );
}
