import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FOMOCountdownProps {
  endDate: Date;
  totalCapacity: number;
  currentCount: number;
  waitingListCapacity: number;
  waitingListCount: number;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function RealEstateFOMOCountdown({
  endDate,
  totalCapacity,
  currentCount,
  waitingListCapacity,
  waitingListCount,
  className,
}: FOMOCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = new Date(endDate).getTime() - Date.now();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const capacityPercent = (currentCount / totalCapacity) * 100;
  const waitingListPercent = (waitingListCount / waitingListCapacity) * 100;
  const totalFilled = currentCount + waitingListCount;
  const totalMax = totalCapacity + waitingListCapacity;
  const isCapacityFull = currentCount >= totalCapacity;
  const isWaitingListFull = waitingListCount >= waitingListCapacity;
  const isFullyClosed = totalFilled >= totalMax;

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (isFullyClosed) return "closed";
    if (timeLeft.total <= 24 * 60 * 60 * 1000) return "critical"; // < 24 hours
    if (timeLeft.total <= 72 * 60 * 60 * 1000) return "high"; // < 3 days
    if (capacityPercent > 70) return "medium";
    return "low";
  };

  const urgency = getUrgencyLevel();

  const urgencyConfig = {
    closed: {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-700",
      progressColor: "bg-gray-400",
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-900",
      progressColor: "bg-red-600",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-900",
      progressColor: "bg-orange-500",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-900",
      progressColor: "bg-yellow-500",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-900",
      progressColor: "bg-blue-500",
    },
  };

  const config = urgencyConfig[urgency];

  if (timeLeft.total <= 0 && !isFullyClosed) {
    return (
      <Card className={cn("border-gray-300 bg-gray-100", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              חלון ההרשמה נסגר
            </h3>
            <p className="text-gray-600">
              ההרשמה לפרויקט זה הסתיימה
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFullyClosed) {
    return (
      <Card className="border-gray-300 bg-gray-100">
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              ההרשמה מלאה!
            </h3>
            <p className="text-gray-600">
              כל המקומות (כולל רשימת המתנה) התמלאו
            </p>
            <div className="mt-4 text-sm text-gray-500">
              {totalFilled} מתוך {totalMax} מקומות
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(`${config.border} ${config.bg}`, className)}>
      <CardContent className="p-6">
        {/* Countdown Timer */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className={cn("h-5 w-5", config.text)} />
            <h3 className={cn("text-lg font-bold", config.text)}>
              {urgency === "critical" ? "⏰ זמן אוזל!" : "זמן שנותר"}
            </h3>
          </div>
          
          <div className="flex justify-center gap-3" dir="ltr">
            <TimeUnit value={timeLeft.days} label="ימים" config={config} />
            <TimeUnit value={timeLeft.hours} label="שעות" config={config} />
            <TimeUnit value={timeLeft.minutes} label="דקות" config={config} />
            <TimeUnit value={timeLeft.seconds} label="שניות" config={config} />
          </div>
        </div>

        {/* Capacity Progress */}
        <div className="space-y-4">
          {/* Main Capacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                מקומות מאושרים
              </span>
              <span className={cn("text-sm font-bold", config.text)}>
                {currentCount} / {totalCapacity}
              </span>
            </div>
            <Progress 
              value={capacityPercent} 
              className="h-3"
              indicatorClassName={config.progressColor}
            />
            {capacityPercent >= 90 && !isCapacityFull && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                🔥 נותרו {totalCapacity - currentCount} מקומות בלבד!
              </p>
            )}
          </div>

          {/* Waiting List */}
          {(isCapacityFull || waitingListCount > 0) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  רשימת המתנה
                </span>
                <span className={cn("text-sm font-bold", config.text)}>
                  {waitingListCount} / {waitingListCapacity}
                </span>
              </div>
              <Progress 
                value={waitingListPercent} 
                className="h-2"
                indicatorClassName="bg-yellow-500"
              />
              {!isWaitingListFull && (
                <p className="text-xs text-yellow-600 mt-1">
                  נותרו {waitingListCapacity - waitingListCount} מקומות ברשימת המתנה
                </p>
              )}
            </div>
          )}

          {/* Urgency Message */}
          {urgency === "critical" && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-red-900">
                🚨 נותרו פחות מ-24 שעות להרשמה!
              </p>
            </div>
          )}

          {urgency === "high" && (
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-orange-900">
                ⚠️ זמן אוזל - המקומות מתמלאים במהירות
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeUnit({ 
  value, 
  label, 
  config 
}: { 
  value: number; 
  label: string; 
  config: { bg: string; text: string; progressColor: string } 
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "rounded-lg px-3 py-2 min-w-[60px]",
        "border-2 shadow-sm",
        config.bg.replace('50', '100'),
        config.text
      )}>
        <div className="text-2xl font-bold tabular-nums">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div className="text-xs mt-1 text-gray-600">{label}</div>
    </div>
  );
}
