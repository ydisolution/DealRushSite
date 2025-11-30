import { useState } from "react";
import { useLocation } from "wouter";
import HeroSection from "@/components/HeroSection";
import DealsGrid from "@/components/DealsGrid";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import Categories from "@/components/Categories";

import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';
import tvImage from '@assets/generated_images/samsung_65_inch_tv.png';
import headphonesImage from '@assets/generated_images/sony_wireless_headphones.png';
import vacuumImage from '@assets/generated_images/dyson_cordless_vacuum.png';
import ipadImage from '@assets/generated_images/ipad_pro_with_keyboard.png';
import coffeeImage from '@assets/generated_images/nespresso_coffee_machine.png';

interface HomeProps {
  onOpenAuth?: () => void;
}

export default function Home({ onOpenAuth }: HomeProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // todo: remove mock functionality
  const mockDeals = [
    {
      id: "deal-1",
      name: "מזגן LG Inverter 12,000 BTU",
      image: acImage,
      originalPrice: 4500,
      currentPrice: 3690,
      participants: 67,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
      nextTierPrice: 3510,
      nextTierParticipants: 100,
      category: "electrical",
      discountPercent: 18,
    },
    {
      id: "deal-2",
      name: "טלוויזיה Samsung QLED 65 אינץ'",
      image: tvImage,
      originalPrice: 6500,
      currentPrice: 4875,
      participants: 52,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      nextTierPrice: 4225,
      nextTierParticipants: 100,
      category: "electronics",
      discountPercent: 25,
    },
    {
      id: "deal-3",
      name: "אוזניות Sony WH-1000XM5",
      image: headphonesImage,
      originalPrice: 1400,
      currentPrice: 890,
      participants: 134,
      targetParticipants: 150,
      endTime: new Date(Date.now() + 45 * 1000),
      nextTierPrice: 799,
      nextTierParticipants: 150,
      category: "electronics",
      discountPercent: 36,
    },
    {
      id: "deal-4",
      name: "שואב אבק Dyson V15 Detect",
      image: vacuumImage,
      originalPrice: 3200,
      currentPrice: 2560,
      participants: 28,
      targetParticipants: 50,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      nextTierPrice: 2400,
      nextTierParticipants: 50,
      category: "electrical",
      discountPercent: 20,
    },
    {
      id: "deal-5",
      name: "Apple iPad Pro 12.9 עם Magic Keyboard",
      image: ipadImage,
      originalPrice: 7500,
      currentPrice: 5625,
      participants: 45,
      targetParticipants: 80,
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      nextTierPrice: 5250,
      nextTierParticipants: 80,
      category: "electronics",
      discountPercent: 25,
    },
    {
      id: "deal-6",
      name: "מכונת קפה Nespresso Vertuo",
      image: coffeeImage,
      originalPrice: 1200,
      currentPrice: 780,
      participants: 89,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      nextTierPrice: 720,
      nextTierParticipants: 100,
      category: "kitchen",
      discountPercent: 35,
    },
  ];

  const filteredDeals = selectedCategory 
    ? mockDeals.filter(deal => deal.category === selectedCategory)
    : mockDeals;

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
        />
      </div>
      <HowItWorks />
      <TrustBadges />
    </div>
  );
}
