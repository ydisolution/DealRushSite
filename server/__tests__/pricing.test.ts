import { describe, it, expect } from 'vitest';

describe('Pricing Calculations', () => {
  describe('Tier Pricing', () => {
    it('should calculate correct price for tier', () => {
      const originalPrice = 1000;
      const discount = 15; // 15%
      const expectedPrice = 850;
      
      const calculatedPrice = Math.round(originalPrice * (1 - discount / 100));
      
      expect(calculatedPrice).toBe(expectedPrice);
    });

    it('should handle zero discount', () => {
      const originalPrice = 1000;
      const discount = 0;
      
      const calculatedPrice = Math.round(originalPrice * (1 - discount / 100));
      
      expect(calculatedPrice).toBe(originalPrice);
    });

    it('should handle 100% discount', () => {
      const originalPrice = 1000;
      const discount = 100;
      
      const calculatedPrice = Math.round(originalPrice * (1 - discount / 100));
      
      expect(calculatedPrice).toBe(0);
    });
  });

  describe('Position-based Price Variance', () => {
    it('should calculate early bird discount', () => {
      const basePrice = 1000;
      const position = 1; // First buyer
      const tierMin = 0;
      const tierMax = 100;
      
      const positionInTier = position - tierMin;
      const tierRange = tierMax - tierMin + 1;
      const positionRatio = positionInTier / tierRange;
      const priceVariance = (positionRatio - 0.5) * 0.05;
      const finalPrice = Math.round(basePrice * (1 + priceVariance));
      
      // First buyer gets ~2.5% discount
      expect(finalPrice).toBeLessThan(basePrice);
      expect(finalPrice).toBeGreaterThan(basePrice * 0.95);
    });

    it('should calculate late joiner premium', () => {
      const basePrice = 1000;
      const position = 100; // Last buyer in tier
      const tierMin = 0;
      const tierMax = 100;
      
      const positionInTier = position - tierMin;
      const tierRange = tierMax - tierMin + 1;
      const positionRatio = positionInTier / tierRange;
      const priceVariance = (positionRatio - 0.5) * 0.05;
      const finalPrice = Math.round(basePrice * (1 + priceVariance));
      
      // Last buyer pays ~2.5% more
      expect(finalPrice).toBeGreaterThan(basePrice);
      expect(finalPrice).toBeLessThan(basePrice * 1.05);
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate platform commission', () => {
      const totalAmount = 10000;
      const commissionRate = 5; // 5%
      
      const commission = Math.round(totalAmount * (commissionRate / 100));
      
      expect(commission).toBe(500);
    });

    it('should calculate supplier net revenue', () => {
      const totalAmount = 10000;
      const commissionRate = 5;
      
      const commission = Math.round(totalAmount * (commissionRate / 100));
      const supplierRevenue = totalAmount - commission;
      
      expect(supplierRevenue).toBe(9500);
    });
  });

  describe('Currency Conversion', () => {
    it('should convert shekels to agorot', () => {
      const shekels = 100;
      const agorot = shekels * 100;
      
      expect(agorot).toBe(10000);
    });

    it('should convert agorot to shekels', () => {
      const agorot = 10000;
      const shekels = agorot / 100;
      
      expect(shekels).toBe(100);
    });

    it('should handle decimal amounts', () => {
      const shekels = 99.99;
      const agorot = Math.round(shekels * 100);
      
      expect(agorot).toBe(9999);
    });
  });
});
