import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, ListOrdered, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Participant {
  id: number;
  initials: string;
  phoneLastDigits: string;
  queuePosition: number;
  selectedApartmentType: string | null;
  funnelStatus: string;
  registeredAt: string;
}

interface ParticipantsListProps {
  projectSlug: string;
  className?: string;
  showWaitingList?: boolean;
}

export default function RealEstateParticipantsList({
  projectSlug,
  className,
  showWaitingList = true,
}: ParticipantsListProps) {
  const { data, isLoading, error } = useQuery<Participant[]>({
    queryKey: [`/api/real-estate/projects/${projectSlug}/participants`],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            רשימת משתתפים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-6 text-center">
          <p className="text-red-800">שגיאה בטעינת רשימת המשתתפים</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            רשימת משתתפים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>עדיין אין משתתפים רשומים</p>
            <p className="text-sm mt-1">היו הראשונים להירשם!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate confirmed participants and waiting list
  const confirmedParticipants = data.filter(p => 
    p.funnelStatus === "CONFIRMED" || p.funnelStatus === "APPROVED"
  );
  const waitingListParticipants = data.filter(p => 
    p.funnelStatus === "WAITING_LIST"
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          רשימת משתתפים
          <Badge variant="secondary" className="mr-auto">
            {confirmedParticipants.length} משתתפים
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Confirmed Participants */}
        {confirmedParticipants.length > 0 && (
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              משתתפים מאושרים (תור FIFO)
            </h3>
            {confirmedParticipants.map((participant, index) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                index={index}
                isWaitingList={false}
              />
            ))}
          </div>
        )}

        {/* Waiting List */}
        {showWaitingList && waitingListParticipants.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              רשימת המתנה ({waitingListParticipants.length})
            </h3>
            {waitingListParticipants.map((participant, index) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                index={index}
                isWaitingList={true}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ParticipantCard({
  participant,
  index,
  isWaitingList,
}: {
  participant: Participant;
  index: number;
  isWaitingList: boolean;
}) {
  const isFirstThree = !isWaitingList && index < 3;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        isWaitingList
          ? "bg-yellow-50 border-yellow-200"
          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm",
        isFirstThree && "ring-2 ring-blue-400 ring-opacity-50"
      )}
    >
      {/* Left side: Position + Info */}
      <div className="flex items-center gap-3 flex-1">
        {/* Queue Position Badge */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full w-10 h-10 font-bold text-sm shrink-0",
            isWaitingList
              ? "bg-yellow-200 text-yellow-800"
              : isFirstThree
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700"
          )}
        >
          {isFirstThree && <Crown className="h-4 w-4 absolute -top-1 -right-1 text-yellow-400" />}
          {participant.queuePosition}
        </div>

        {/* Participant Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {participant.initials}
            </span>
            <span className="text-sm text-gray-500" dir="ltr">
              •••{participant.phoneLastDigits}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(participant.registeredAt).toLocaleDateString("he-IL", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Right side: Apartment Type */}
      {participant.selectedApartmentType && (
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-gray-400" />
          <Badge variant="outline" className="text-xs">
            {getApartmentLabel(participant.selectedApartmentType)}
          </Badge>
        </div>
      )}

      {/* Status Badge */}
      {isWaitingList && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mr-2">
          המתנה
        </Badge>
      )}

      {isFirstThree && !isWaitingList && (
        <Badge className="bg-blue-500 text-white mr-2">
          Top {index + 1}
        </Badge>
      )}
    </div>
  );
}

function getApartmentLabel(type: string): string {
  const labels: Record<string, string> = {
    "2_ROOM": "2 חדרים",
    "3_ROOM": "3 חדרים",
    "4_ROOM": "4 חדרים",
    "5_ROOM": "5 חדרים",
    "PENTHOUSE": "פנטהאוז",
    "GARDEN": "דירת גן",
  };
  return labels[type] || type;
}
