import { useLocation } from "wouter";
import Dashboard from "@/components/Dashboard";

import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';
import headphonesImage from '@assets/generated_images/sony_wireless_headphones.png';
import tvImage from '@assets/generated_images/samsung_65_inch_tv.png';

interface DashboardPageProps {
  onLogout?: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockUser = {
    name: "ישראל ישראלי",
    email: "israel@example.com",
    totalSaved: 2340,
    totalOrders: 7,
    avgDiscount: 32,
  };

  // todo: remove mock functionality
  const mockDeals = [
    {
      id: "deal-1",
      productName: "מזגן LG Inverter 12,000 BTU",
      productImage: acImage,
      status: "active" as const,
      yourPrice: 3690,
      currentPrice: 3690,
      endTime: new Date(Date.now() + 17 * 60 * 60 * 1000),
      savedAmount: 810,
    },
    {
      id: "deal-2",
      productName: "טלוויזיה Samsung QLED 65 אינץ'",
      productImage: tvImage,
      status: "active" as const,
      yourPrice: 5200,
      currentPrice: 4875,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      savedAmount: 1625,
    },
    {
      id: "deal-3",
      productName: "אוזניות Sony WH-1000XM5",
      productImage: headphonesImage,
      status: "shipped" as const,
      yourPrice: 890,
      currentPrice: 890,
      completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      savedAmount: 510,
      shippingStatus: "בדרך אליך - צפי הגעה מחר",
      trackingNumber: "IL123456789",
    },
  ];

  // todo: remove mock functionality
  const mockNotifications = [
    { id: "n1", message: "המחיר בדיל 'מזגן LG' ירד! עכשיו ₪3,690", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false },
    { id: "n2", message: "דיל 'אוזניות Sony' הסתיים - שילמת ₪890", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: true },
    { id: "n3", message: "משלוח יצא - חבילה מגיעה מחר", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), read: false },
  ];

  return (
    <Dashboard 
      user={mockUser}
      deals={mockDeals}
      notifications={mockNotifications}
      onViewDeal={(dealId) => setLocation(`/deal/${dealId}`)}
      onLogout={onLogout}
    />
  );
}
