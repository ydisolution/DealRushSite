import ActivityFeed from '../ActivityFeed';

export default function ActivityFeedExample() {
  // todo: remove mock functionality
  const mockActivities = [
    { id: "1", type: "join" as const, userName: "רונית מ.", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
    { id: "2", type: "join" as const, userName: "יוסי א.", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { id: "3", type: "price_drop" as const, priceTo: 3690, timestamp: new Date(Date.now() - 8 * 60 * 1000) },
    { id: "4", type: "join" as const, userName: "שירה כ.", timestamp: new Date(Date.now() - 12 * 60 * 1000) },
    { id: "5", type: "join" as const, userName: "אבי ל.", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
  ];

  return (
    <div className="max-w-sm">
      <ActivityFeed activities={mockActivities} />
    </div>
  );
}
