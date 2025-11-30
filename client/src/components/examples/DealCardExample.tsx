import DealCard from '../DealCard';
import acImage from '@assets/generated_images/lg_inverter_air_conditioner.png';

export default function DealCardExample() {
  // todo: remove mock functionality
  const mockDeal = {
    id: "deal-1",
    name: "מזגן LG Inverter 12,000 BTU",
    description: "מזגן אינוורטר שקט במיוחד",
    image: acImage,
    originalPrice: 4500,
    currentPrice: 3690,
    participants: 67,
    targetParticipants: 100,
    endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
    nextTierPrice: 3510,
    nextTierParticipants: 100,
  };

  return (
    <div className="max-w-sm">
      <DealCard 
        deal={mockDeal}
        onJoin={(id) => console.log('Join deal:', id)}
        onView={(id) => console.log('View deal:', id)}
      />
    </div>
  );
}
