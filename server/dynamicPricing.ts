/**
 * Dynamic Pricing Engine
 * מחשב מחירים דינמיים למשתתפים על פי מיקומם בתור
 */

import type { Deal, Tier } from "../shared/schema";

interface PriceCalculationResult {
  basePrice: number; // מחיר הבסיס (ממוצע) לפי המדרגה הנוכחית
  dynamicPrice: number; // המחיר הדינמי לפי המיקום
  discount: number; // אחוז ההנחה לפי המדרגה
  positionDiscount: number; // אחוז ההנחה/תוספת לפי המיקום (-2% עד +2%)
  totalParticipants: number; // כמות משתתפים כוללת
}

/**
 * מחשב את המדרגה הנוכחית לפי מספר המשתתפים
 */
export function getCurrentTier(tiers: Tier[], participantCount: number): Tier | null {
  if (!tiers || tiers.length === 0) return null;
  
  const sortedTiers = [...tiers].sort((a, b) => a.minParticipants - b.minParticipants);
  
  // מחפש את המדרגה המתאימה
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    const tier = sortedTiers[i];
    if (participantCount >= tier.minParticipants) {
      return tier;
    }
  }
  
  // אם אין מדרגה מתאימה, מחזיר את הראשונה
  return sortedTiers[0];
}

/**
 * מחשב מחיר דינמי למשתתף לפי מיקומו
 * @param originalPrice - מחיר מקורי
 * @param position - מיקום בתור (1 = ראשון)
 * @param totalParticipants - כמות כוללת של משתתפים
 * @param currentTier - המדרגה הנוכחית
 * @param priceDeltaPercentage - הפרש אחוזים בין ראשון לאחרון (ברירת מחדל 4%)
 */
export function calculateDynamicPrice(
  originalPrice: number,
  position: number,
  totalParticipants: number,
  currentTier: Tier | null,
  priceDeltaPercentage: number = 4
): PriceCalculationResult {
  if (!currentTier) {
    return {
      basePrice: originalPrice,
      dynamicPrice: originalPrice,
      discount: 0,
      positionDiscount: 0,
      totalParticipants,
    };
  }

  // מחיר בסיס = מחיר מקורי פחות הנחה של המדרגה
  const tierDiscount = currentTier.discount || 0;
  const basePrice = currentTier.price || Math.round(originalPrice * (1 - tierDiscount / 100));

  // אם יש רק משתתף אחד, המחיר הוא המחיר הבסיסי
  if (totalParticipants <= 1) {
    return {
      basePrice,
      dynamicPrice: basePrice,
      discount: tierDiscount,
      positionDiscount: 0,
      totalParticipants,
    };
  }

  // חישוב אחוז ההנחה/תוספת לפי מיקום
  // הראשון: +2% הנחה נוספת = מחיר נמוך יותר
  // האחרון: -2% הנחה = מחיר גבוה יותר
  // כולם באמצע: חלוקה לינארית
  
  const maxDiscount = priceDeltaPercentage / 2; // 2% (ברירת מחדל)
  const minDiscount = -maxDiscount; // -2% (ברירת מחדל)
  
  // חישוב ליניארי:
  // position 1 -> minDiscount (-2%) = מחיר גבוה (פחות הנחה)
  // position totalParticipants -> maxDiscount (+2%) = מחיר נמוך (יותר הנחה)
  const positionDiscount = minDiscount + ((position - 1) / (totalParticipants - 1)) * priceDeltaPercentage;
  
  // מחיר דינמי = מחיר בסיס * (1 + אחוז המיקום)
  // positionDiscount שלילי (-2%) = המחיר עולה ב-2%
  // positionDiscount חיובי (+2%) = המחיר יורד ב-2%
  const dynamicPrice = Math.round(basePrice * (1 + positionDiscount / 100));

  return {
    basePrice,
    dynamicPrice,
    discount: tierDiscount,
    positionDiscount,
    totalParticipants,
  };
}

/**
 * מחשב מחירים עבור כל המשתתפים בדיל
 * משמש לעדכון רטרואקטיבי כשמגיעים למדרגה חדשה
 */
export function calculateAllParticipantPrices(
  deal: Deal,
  participants: Array<{ position: number; quantity: number }>
): Map<number, PriceCalculationResult> {
  const pricesMap = new Map<number, PriceCalculationResult>();
  const totalParticipants = participants.reduce((sum, p) => sum + p.quantity, 0);
  const currentTier = getCurrentTier(deal.tiers as Tier[], totalParticipants);
  
  participants.forEach(participant => {
    const priceCalc = calculateDynamicPrice(
      deal.originalPrice,
      participant.position,
      totalParticipants,
      currentTier,
      deal.priceDeltaPercentage || 4
    );
    
    pricesMap.set(participant.position, priceCalc);
  });
  
  return pricesMap;
}

/**
 * מחשב סימולציה של מחירים עבור מספר מדרגות
 * משמש לתצוגה באדמין
 */
export function simulatePricing(
  originalPrice: number,
  tier: Tier,
  unitsPerTier: number,
  priceDeltaPercentage: number = 4
): Array<{
  position: number;
  price: number;
  discount: number;
  positionDiscount: number;
  differenceFromPrevious: number;
}> {
  const results = [];
  const basePrice = tier.price || Math.round(originalPrice * (1 - tier.discount / 100));
  
  for (let position = 1; position <= unitsPerTier; position++) {
    const calc = calculateDynamicPrice(
      originalPrice,
      position,
      unitsPerTier,
      tier,
      priceDeltaPercentage
    );
    
    const prevPrice: number = position > 1 ? results[position - 2].price : calc.dynamicPrice;
    const differenceFromPrevious: number = calc.dynamicPrice - prevPrice;
    
    results.push({
      position,
      price: calc.dynamicPrice,
      discount: calc.discount,
      positionDiscount: calc.positionDiscount,
      differenceFromPrevious,
    });
  }
  
  return results;
}

/**
 * בודק האם צריך לעדכן מחירים (כשעוברים מדרגה)
 */
export function shouldUpdatePrices(
  oldParticipantCount: number,
  newParticipantCount: number,
  tiers: Tier[]
): boolean {
  const oldTier = getCurrentTier(tiers, oldParticipantCount);
  const newTier = getCurrentTier(tiers, newParticipantCount);
  
  // אם המדרגה השתנתה, צריך לעדכן
  return oldTier?.minParticipants !== newTier?.minParticipants;
}
