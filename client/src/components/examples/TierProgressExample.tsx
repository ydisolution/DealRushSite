import TierProgress from '../TierProgress';

export default function TierProgressExample() {
  // todo: remove mock functionality
  const mockTiers = [
    { minParticipants: 1, maxParticipants: 30, price: 4050, discount: 10 },
    { minParticipants: 31, maxParticipants: 60, price: 3825, discount: 15 },
    { minParticipants: 61, maxParticipants: 100, price: 3690, discount: 18 },
    { minParticipants: 101, maxParticipants: 150, price: 3510, discount: 22 },
    { minParticipants: 151, maxParticipants: 200, price: 3150, discount: 30 },
  ];

  return (
    <div className="max-w-sm">
      <TierProgress 
        tiers={mockTiers}
        currentParticipants={67}
        originalPrice={4500}
      />
    </div>
  );
}
