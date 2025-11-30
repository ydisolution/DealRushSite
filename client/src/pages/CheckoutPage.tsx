import { useLocation, useParams } from "wouter";
import Checkout from "@/components/Checkout";

import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';
import tvImage from '@assets/generated_images/samsung_65_inch_tv.png';
import headphonesImage from '@assets/generated_images/sony_wireless_headphones.png';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockDeals: Record<string, any> = {
    "deal-1": {
      id: "deal-1",
      name: "מזגן LG Inverter 12,000 BTU",
      image: acImage,
      originalPrice: 4500,
      currentPrice: 3690,
      endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
    },
    "deal-2": {
      id: "deal-2",
      name: "טלוויזיה Samsung QLED 65 אינץ'",
      image: tvImage,
      originalPrice: 6500,
      currentPrice: 4875,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    "deal-3": {
      id: "deal-3",
      name: "אוזניות Sony WH-1000XM5",
      image: headphonesImage,
      originalPrice: 1400,
      currentPrice: 890,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    },
  };

  const deal = mockDeals[id || "deal-1"] || mockDeals["deal-1"];

  return (
    <Checkout 
      deal={deal}
      onBack={() => setLocation(`/deal/${id}`)}
      onComplete={() => setLocation('/dashboard')}
    />
  );
}
