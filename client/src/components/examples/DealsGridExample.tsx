import DealsGrid from '../DealsGrid';
import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';
import tvImage from '@assets/generated_images/samsung_65_inch_tv.png';
import headphonesImage from '@assets/generated_images/sony_wireless_headphones.png';

export default function DealsGridExample() {
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
    },
    {
      id: "deal-2",
      name: "טלוויזיה Samsung QLED 65 אינץ'",
      image: tvImage,
      originalPrice: 6500,
      currentPrice: 4875,
      participants: 52,
      targetParticipants: 100,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      nextTierPrice: 4225,
      nextTierParticipants: 100,
    },
    {
      id: "deal-3",
      name: "אוזניות Sony WH-1000XM5",
      image: headphonesImage,
      originalPrice: 1400,
      currentPrice: 890,
      participants: 134,
      targetParticipants: 150,
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      nextTierPrice: 799,
      nextTierParticipants: 150,
    },
  ];

  return (
    <DealsGrid 
      deals={mockDeals}
      onJoinDeal={(id) => console.log('Join deal:', id)}
      onViewDeal={(id) => console.log('View deal:', id)}
    />
  );
}
