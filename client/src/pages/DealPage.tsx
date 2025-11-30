import { useLocation, useParams } from "wouter";
import DealDetail from "@/components/DealDetail";

import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';
import tvImage from '@assets/generated_images/samsung_65_inch_tv.png';
import headphonesImage from '@assets/generated_images/sony_wireless_headphones.png';
import vacuumImage from '@assets/generated_images/dyson_cordless_vacuum.png';
import ipadImage from '@assets/generated_images/ipad_pro_with_keyboard.png';
import coffeeImage from '@assets/generated_images/nespresso_coffee_machine.png';

interface DealPageProps {
  onOpenAuth?: () => void;
}

export default function DealPage({ onOpenAuth }: DealPageProps) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockDeals: Record<string, any> = {
    "deal-1": {
      id: "deal-1",
      name: "מזגן LG Inverter 12,000 BTU",
      description: "מזגן אינוורטר שקט במיוחד מבית LG. טכנולוגיית Dual Inverter לחיסכון באנרגיה עד 70%. קירור וחימום מהירים, פילטר אנטי-בקטריאלי מובנה.",
      images: [acImage],
      originalPrice: 4500,
      currentPrice: 3690,
      participants: 67,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 30, price: 4050, discount: 10 },
        { minParticipants: 31, maxParticipants: 60, price: 3825, discount: 15 },
        { minParticipants: 61, maxParticipants: 100, price: 3690, discount: 18 },
        { minParticipants: 101, maxParticipants: 150, price: 3510, discount: 22 },
        { minParticipants: 151, maxParticipants: 200, price: 3150, discount: 30 },
      ],
      specs: [
        { label: "הספק קירור", value: "12,000 BTU" },
        { label: "דירוג אנרגיה", value: "A+++" },
        { label: "רמת רעש", value: "19dB" },
        { label: "אחריות", value: "5 שנים" },
      ],
      reviews: [
        { id: "r1", userName: "דנה מ.", rating: 5, comment: "מזגן מעולה! שקט מאוד וחוסך בחשמל.", date: new Date() },
        { id: "r2", userName: "יוסי א.", rating: 4, comment: "התקנה קלה, ממליץ בחום.", date: new Date() },
      ],
    },
    "deal-2": {
      id: "deal-2",
      name: "טלוויזיה Samsung QLED 65 אינץ'",
      description: "טלוויזיה QLED 4K עם טכנולוגיית Quantum Dot. מסך 65 אינץ' עם רזולוציה מדהימה. Smart TV עם כל האפליקציות המובילות.",
      images: [tvImage],
      originalPrice: 6500,
      currentPrice: 4875,
      participants: 52,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 25, price: 5850, discount: 10 },
        { minParticipants: 26, maxParticipants: 50, price: 5525, discount: 15 },
        { minParticipants: 51, maxParticipants: 75, price: 4875, discount: 25 },
        { minParticipants: 76, maxParticipants: 100, price: 4225, discount: 35 },
      ],
      specs: [
        { label: "גודל מסך", value: "65 אינץ'" },
        { label: "רזולוציה", value: "4K Ultra HD" },
        { label: "טכנולוגיה", value: "QLED Quantum Dot" },
        { label: "קצב רענון", value: "120Hz" },
      ],
      reviews: [],
    },
    "deal-3": {
      id: "deal-3",
      name: "אוזניות Sony WH-1000XM5",
      description: "אוזניות אלחוטיות פרימיום עם ביטול רעשים מוביל בתעשייה. נוחות יוצאת דופן לשימוש ממושך. 30 שעות סוללה.",
      images: [headphonesImage],
      originalPrice: 1400,
      currentPrice: 890,
      participants: 134,
      targetParticipants: 150,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 50, price: 1190, discount: 15 },
        { minParticipants: 51, maxParticipants: 100, price: 980, discount: 30 },
        { minParticipants: 101, maxParticipants: 150, price: 890, discount: 36 },
        { minParticipants: 151, maxParticipants: 200, price: 799, discount: 43 },
      ],
      specs: [
        { label: "סוללה", value: "30 שעות" },
        { label: "ביטול רעשים", value: "מתקדם" },
        { label: "חיבור", value: "Bluetooth 5.2" },
        { label: "משקל", value: "250 גרם" },
      ],
      reviews: [],
    },
    "deal-4": {
      id: "deal-4",
      name: "שואב אבק Dyson V15 Detect",
      description: "שואב אבק אלחוטי חזק במיוחד עם טכנולוגיית לייזר לזיהוי אבק. סוללה ל-60 דקות שאיבה.",
      images: [vacuumImage],
      originalPrice: 3200,
      currentPrice: 2560,
      participants: 28,
      targetParticipants: 50,
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 20, price: 2880, discount: 10 },
        { minParticipants: 21, maxParticipants: 40, price: 2560, discount: 20 },
        { minParticipants: 41, maxParticipants: 60, price: 2400, discount: 25 },
      ],
      specs: [
        { label: "זמן פעולה", value: "60 דקות" },
        { label: "עוצמת שאיבה", value: "240AW" },
        { label: "נפח מיכל", value: "0.76 ליטר" },
      ],
      reviews: [],
    },
    "deal-5": {
      id: "deal-5",
      name: "Apple iPad Pro 12.9 עם Magic Keyboard",
      description: "הטאבלט החזק ביותר של Apple עם שבב M2. מסך Liquid Retina XDR מדהים. כולל Magic Keyboard.",
      images: [ipadImage],
      originalPrice: 7500,
      currentPrice: 5625,
      participants: 45,
      targetParticipants: 80,
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 30, price: 6750, discount: 10 },
        { minParticipants: 31, maxParticipants: 60, price: 5625, discount: 25 },
        { minParticipants: 61, maxParticipants: 100, price: 5250, discount: 30 },
      ],
      specs: [
        { label: "מסך", value: "12.9 אינץ' Liquid Retina XDR" },
        { label: "מעבד", value: "Apple M2" },
        { label: "אחסון", value: "256GB" },
      ],
      reviews: [],
    },
    "deal-6": {
      id: "deal-6",
      name: "מכונת קפה Nespresso Vertuo",
      description: "מכונת קפה קפסולות פרימיום. הכנת קפה בלחיצת כפתור. קצף חלב מובנה.",
      images: [coffeeImage],
      originalPrice: 1200,
      currentPrice: 780,
      participants: 89,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      tiers: [
        { minParticipants: 1, maxParticipants: 40, price: 960, discount: 20 },
        { minParticipants: 41, maxParticipants: 80, price: 840, discount: 30 },
        { minParticipants: 81, maxParticipants: 120, price: 720, discount: 40 },
      ],
      specs: [
        { label: "לחץ", value: "19 בר" },
        { label: "מיכל מים", value: "1.1 ליטר" },
        { label: "זמן חימום", value: "25 שניות" },
      ],
      reviews: [],
    },
  };

  const deal = mockDeals[id || "deal-1"] || mockDeals["deal-1"];

  // todo: remove mock functionality
  const mockActivities = [
    { id: "1", type: "join" as const, userName: "רונית מ.", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
    { id: "2", type: "join" as const, userName: "יוסי א.", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "3", type: "price_drop" as const, priceTo: deal.currentPrice, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
    { id: "4", type: "join" as const, userName: "שירה כ.", timestamp: new Date(Date.now() - 12 * 60 * 1000) },
    { id: "5", type: "join" as const, userName: "אבי ל.", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
  ];

  return (
    <DealDetail 
      deal={deal}
      activities={mockActivities}
      onJoin={() => {
        onOpenAuth?.();
      }}
      onBack={() => setLocation('/')}
    />
  );
}
