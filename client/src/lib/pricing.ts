export interface PositionPricing {
  firstBuyerPrice: number;
  lastBuyerPrice: number;
  avgPrice: number;
}

const VARIANCE_PERCENT = 0.025;

export function calculatePositionPricing(tierAveragePrice: number): PositionPricing {
  const avgPrice = Math.round(tierAveragePrice);
  const variance = tierAveragePrice * VARIANCE_PERCENT;
  const firstBuyerPrice = Math.round(tierAveragePrice - variance);
  const lastBuyerPrice = Math.round(tierAveragePrice + variance);
  return { firstBuyerPrice, lastBuyerPrice, avgPrice };
}

export function calculatePricingFromDiscount(originalPrice: number, discountPercent: number): PositionPricing {
  const tierAveragePrice = originalPrice * (1 - discountPercent / 100);
  return calculatePositionPricing(tierAveragePrice);
}

export function calculatePricingFromTier(
  tier: { price?: number; discount: number }, 
  originalPrice: number
): PositionPricing {
  if (tier.price && tier.price > 0) {
    return calculatePositionPricing(tier.price);
  }
  return calculatePricingFromDiscount(originalPrice, tier.discount);
}
