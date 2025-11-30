import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import DealsGrid from "@/components/DealsGrid";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import Categories from "@/components/Categories";
import type { Deal } from "@shared/schema";

interface HomeProps {
  onOpenAuth?: () => void;
}

export default function Home({ onOpenAuth }: HomeProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

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

  const filteredDeals = selectedCategory 
    ? transformedDeals.filter(deal => deal.category === selectedCategory)
    : transformedDeals;

  const handleViewDeal = (dealId: string) => {
    setLocation(`/deal/${dealId}`);
  };

  const handleJoinDeal = (dealId: string) => {
    onOpenAuth?.();
  };

  return (
    <div data-testid="home-page">
      <HeroSection 
        onGetStarted={() => document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth' })}
        onLearnMore={() => setLocation('/how-it-works')}
      />
      <Categories 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <div id="deals-section">
        <DealsGrid 
          deals={filteredDeals}
          title={selectedCategory ? `דילים בקטגוריה` : "הדילים הפעילים עכשיו"}
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
