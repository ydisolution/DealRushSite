import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import DealsGrid from "@/components/DealsGrid";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import Categories from "@/components/Categories";
import SearchFilter from "@/components/SearchFilter";
import { useAuth } from "@/hooks/useAuth";
import type { Deal } from "@shared/schema";

interface HomeProps {
  onOpenAuth?: () => void;
}

export default function Home({ onOpenAuth }: HomeProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const maxPrice = useMemo(() => {
    if (deals.length === 0) return 3000000;
    return Math.max(...deals.map(d => d.originalPrice));
  }, [deals]);

  const heroStats = useMemo(() => {
    if (deals.length === 0) {
      return {
        activeBuyers: 2847,
        avgDiscount: 35,
        openDeals: 12,
      };
    }
    
    const totalParticipants = deals.reduce((sum, deal) => sum + deal.participants, 0);
    const totalDiscount = deals.reduce((sum, deal) => {
      const discount = Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100);
      return sum + discount;
    }, 0);
    const avgDiscount = deals.length > 0 ? Math.round(totalDiscount / deals.length) : 35;
    
    return {
      activeBuyers: totalParticipants > 0 ? totalParticipants : 2847,
      avgDiscount: avgDiscount > 0 ? avgDiscount : 35,
      openDeals: deals.length,
    };
  }, [deals]);

  const transformedDeals = deals.map(deal => ({
    id: deal.id,
    name: deal.name,
    image: deal.images[0] || "",
    originalPrice: deal.originalPrice,
    currentPrice: deal.currentPrice,
    participants: deal.participants,
    targetParticipants: deal.targetParticipants,
    endTime: new Date(deal.endTime),
    nextTierPrice: deal.tiers.length > 1 
      ? deal.tiers.find(t => deal.participants < t.maxParticipants && deal.participants >= t.minParticipants - 1)?.price
      : undefined,
    nextTierParticipants: deal.tiers.length > 1 
      ? deal.tiers.find(t => deal.participants < t.maxParticipants)?.maxParticipants
      : undefined,
    category: deal.category,
    discountPercent: deal.tiers.find(t => 
      deal.participants >= t.minParticipants && deal.participants <= t.maxParticipants
    )?.discount || Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100),
  }));

  const filteredDeals = useMemo(() => {
    return transformedDeals.filter(deal => {
      const matchesCategory = !selectedCategory || deal.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        deal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = deal.currentPrice >= priceRange[0] && 
        deal.currentPrice <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [transformedDeals, selectedCategory, searchTerm, priceRange]);

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const handleViewDeal = (dealId: string) => {
    setLocation(`/deal/${dealId}`);
  };

  const handleJoinDeal = (dealId: string) => {
    if (isAuthenticated) {
      setLocation(`/checkout/${dealId}`);
    } else {
      onOpenAuth?.();
    }
  };

  return (
    <div data-testid="home-page">
      <HeroSection 
        onGetStarted={() => document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth' })}
        onLearnMore={() => setLocation('/how-it-works')}
        stats={heroStats}
      />
      <Categories 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <div className="container mx-auto px-4 py-6">
        <SearchFilter
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onPriceRangeChange={handlePriceRangeChange}
          selectedCategory={selectedCategory}
          maxPrice={maxPrice}
        />
      </div>
      <div id="deals-section">
        <DealsGrid 
          deals={filteredDeals}
          title={
            searchTerm 
              ? `תוצאות חיפוש: "${searchTerm}"` 
              : selectedCategory 
                ? `דילים בקטגוריה` 
                : "הדילים הפעילים עכשיו"
          }
          onViewDeal={handleViewDeal}
          onJoinDeal={handleJoinDeal}
          isLoading={isLoading}
        />
      </div>
      <HowItWorks />
      <TrustBadges />
    </div>
  );
}
