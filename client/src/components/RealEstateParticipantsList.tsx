import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, ListOrdered, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Participant {
  queuePosition: number | null;
  initials: string;
  phoneLast4: string;
  apartmentType: string | null;
  status: string;
  registeredAt: string;
}

interface ParticipantsResponse {
  participants: Participant[];
  totalConfirmed: number;
  totalWaitingList: number;
  capacity: number;
  waitingListCapacity: number;
}

interface ParticipantsListProps {
  projectSlug: string;
  className?: string;
  showWaitingList?: boolean;
  totalCapacity?: number;
  currentRegistrantCount?: number;
}

export default function RealEstateParticipantsList({
  projectSlug,
  className,
  showWaitingList = true,
  totalCapacity,
  currentRegistrantCount,
}: ParticipantsListProps) {
  const { data, isLoading, error } = useQuery<ParticipantsResponse>({
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

  // Extract participants array from response
  const participants = data?.participants || [];

  if (!participants || participants.length === 0) {
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
  const confirmedParticipants = participants.filter(p => 
    p.status === "CONFIRMED_PARTICIPANT" || p.status === "PRE_REGISTERED"
  );
  const waitingListParticipants = participants.filter(p => 
    p.status === "WAITING_LIST"
  );

  return (
    <Card className={cn("shadow-lg border-2 border-purple-100", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Users className="h-6 w-6 text-[#7B2FF7]" />
            </div>
            <span className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 bg-clip-text text-transparent">
              רשימת נרשמים לקבוצה
            </span>
          </CardTitle>
        </div>
        {totalCapacity && currentRegistrantCount !== undefined && (
          <div className="mt-4 flex items-center justify-center gap-2 p-5 bg-white rounded-xl shadow-md border-2 border-purple-200">
            <div className="text-center flex-1">
              <div className="relative">
                <p className="text-4xl font-bold bg-gradient-to-r from-[#7B2FF7] to-purple-600 bg-clip-text text-transparent">
                  {currentRegistrantCount}
                </p>
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mt-1">נרשמים</p>
            </div>
            <div className="text-3xl text-purple-300 font-light">/</div>
            <div className="text-center flex-1">
              <p className="text-4xl font-bold text-gray-700">{totalCapacity}</p>
              <p className="text-sm text-gray-600 font-medium mt-1">מקומות זמינים</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {/* Confirmed Participants */}
        {confirmedParticipants.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="h-5 w-5 text-[#7B2FF7]" />
              <h3 className="text-lg font-bold text-gray-800">
                משתתפים מאושרים
              </h3>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {confirmedParticipants.length}
              </Badge>
            </div>
            {confirmedParticipants.map((participant, index) => (
              <ParticipantCard
                key={`confirmed-${index}`}
                participant={participant}
                index={index}
                isWaitingList={false}
                totalCapacity={totalCapacity || 0}
              />
            ))}
          </div>
        )}

        {/* Waiting List */}
        {showWaitingList && waitingListParticipants.length > 0 && (
          <div className="space-y-3 border-t-2 border-yellow-200 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-800">
                רשימת המתנה
              </h3>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {waitingListParticipants.length}
              </Badge>
            </div>
            {waitingListParticipants.map((participant, index) => (
              <ParticipantCard
                key={`waiting-${index}`}
                participant={participant}
                index={confirmedParticipants.length + index}
                isWaitingList={true}
                totalCapacity={totalCapacity || 0}
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
  totalCapacity,
}: {
  participant: Participant;
  index: number;
  isWaitingList: boolean;
  totalCapacity: number;
}) {
  const position = index + 1;
  const displayPosition = isWaitingList 
    ? `${position}/${totalCapacity} (ממתין)`
    : `${position}/${totalCapacity}`;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl",
        isWaitingList
          ? "bg-gradient-to-r from-yellow-50 to-amber-50"
          : "bg-white",
      )}
    >
      {/* Left side: Position + Info */}
      <div className="flex items-center gap-4 flex-1">
        {/* Queue Position Badge */}
        <div className="relative">
          <div
            className={cn(
              "flex items-center justify-center rounded-xl w-16 h-12 font-bold text-sm shrink-0 shadow-sm",
              isWaitingList
                ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
            )}
          >
            {displayPosition}
          </div>
        </div>

        {/* Participant Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">
              {participant.initials}
            </span>
            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded" dir="ltr">
              •••{participant.phoneLast4}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
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
      <div className="flex items-center gap-3">
        {participant.apartmentType && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Home className="h-4 w-4 text-[#7B2FF7]" />
            <span className="text-sm font-semibold text-gray-700">
              {getApartmentLabel(participant.apartmentType)}
            </span>
          </div>
        )}
      </div>
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
