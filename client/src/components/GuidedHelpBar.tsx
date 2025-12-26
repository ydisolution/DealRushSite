import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface GuidedHelpBarProps {
  projectId: string;
  onAskAssistant: () => void;
}

interface StageInfo {
  currentStage: string;
  countdown?: number;
  nextStageDate?: string;
}

export default function GuidedHelpBar({ projectId, onAskAssistant }: GuidedHelpBarProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  const { data: stageInfo, isLoading } = useQuery<StageInfo>({
    queryKey: [`/api/real-estate/projects/${projectId}/stage`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (stageInfo?.countdown) {
      setCountdown(stageInfo.countdown);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stageInfo?.countdown]);

  if (isLoading || !stageInfo) {
    return null;
  }

  const getStageText = (stage: string) => {
    const stages: Record<string, { title: string; description: string; color: string }> = {
      EARLY_REGISTRATION: {
        title: "רישום מוקדם לאירוע הפרויקט",
        description: "נרשמים כעת למעוניינים. אין התחייבות, רק הבעת עניין.",
        color: "bg-blue-500",
      },
      PRESENTATION: {
        title: "אירוע היכרות עם הרוכשים",
        description: "הקבלן מציג את הפרויקט. מוסברים ההטבות והמיגונים לרוכשים.",
        color: "bg-purple-500",
      },
      FINAL_REGISTRATION: {
        title: "חלון אישור השתתפות",
        description: "חלון זמן מוגבל לאישור השתתפות בתהליך צירוף הרוכשים.",
        color: "bg-orange-500",
      },
      POST_REGISTRATION: {
        title: "בחירת דירה וחתימת חוזה",
        description: "מבוצע ישירות מול הקבלן (מחוץ לפלטפורמה).",
        color: "bg-green-500",
      },
    };

    return stages[stage] || stages.EARLY_REGISTRATION;
  };

  const stageData = getStageText(stageInfo.currentStage);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-50 to-white border-b shadow-sm" dir="rtl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Stage Info */}
          <div className="flex items-center gap-3">
            <Badge className={`${stageData.color} text-white text-sm px-3 py-1`}>
              {stageData.title}
            </Badge>
            <div className="text-sm">
              <p className="font-semibold text-gray-800">מה קורה עכשיו?</p>
              <p className="text-gray-600">{stageData.description}</p>
            </div>
          </div>

          {/* Countdown Timer (only during final registration) */}
          {stageInfo.currentStage === "FINAL_REGISTRATION" && countdown !== null && countdown > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
              <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
              <div className="text-center">
                <p className="text-xs text-orange-600 font-semibold">זמן נותר</p>
                <p className="text-lg font-bold text-orange-700 font-mono">
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
          )}

          {/* Ask Assistant Button */}
          <Button
            onClick={onAskAssistant}
            variant="outline"
            className="border-[#7B2FF7] text-[#7B2FF7] hover:bg-purple-50 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            שאל את העוזר
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            DealRush אינה צד לעסקת הרכישה. הבחירה והחתימה מתבצעות ישירות מול הקבלן. הרישום אינו התחייבות משפטית.
          </p>
        </div>
      </div>
    </div>
  );
}
