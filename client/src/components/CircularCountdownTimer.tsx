import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface CircularCountdownTimerProps {
  endTime: Date | string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showEndDate?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

type TimeStatus = "safe" | "warning" | "urgent" | "critical";

export default function CircularCountdownTimer({ 
  endTime: endTimeProp, 
  size = "md",
  showLabels = true,
  showEndDate = false,
  onExpire 
}: CircularCountdownTimerProps) {
  const endTime = useMemo(() => {
    return typeof endTimeProp === 'string' ? new Date(endTimeProp) : endTimeProp;
  }, [endTimeProp]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [status, setStatus] = useState<TimeStatus>("safe");
  const [progress, setProgress] = useState(100);
  const [initialDuration] = useState(() => {
    const now = new Date().getTime();
    const end = typeof endTimeProp === 'string' ? new Date(endTimeProp).getTime() : endTimeProp.getTime();
    return Math.max(end - now, 1);
  });

  useEffect(() => {
    const totalDuration = initialDuration;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endTime.getTime() - now;
      
      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      }

      const totalDays = difference / (1000 * 60 * 60 * 24);
      const totalSeconds = difference / 1000;

      if (totalSeconds <= 60) {
        setStatus("critical");
      } else if (totalDays < 1) {
        setStatus("urgent");
      } else if (totalDays <= 3) {
        setStatus("warning");
      } else {
        setStatus("safe");
      }

      const progressPercent = Math.max(0, Math.min(100, (difference / Math.max(totalDuration, 1)) * 100));
      setProgress(progressPercent);

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalSeconds: Math.floor(totalSeconds),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire, initialDuration]);

  const sizeConfig = {
    sm: { diameter: 100, strokeWidth: 6, fontSize: "text-xs", labelSize: "text-[8px]", unitSize: "text-[10px]" },
    md: { diameter: 140, strokeWidth: 8, fontSize: "text-sm", labelSize: "text-[9px]", unitSize: "text-xs" },
    lg: { diameter: 180, strokeWidth: 10, fontSize: "text-base", labelSize: "text-[10px]", unitSize: "text-sm" },
  };

  const config = sizeConfig[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const statusColors = {
    safe: {
      stroke: "stroke-emerald-500",
      bg: "stroke-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      unitBg: "bg-emerald-500/10",
    },
    warning: {
      stroke: "stroke-amber-500",
      bg: "stroke-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      glow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      unitBg: "bg-amber-500/10",
    },
    urgent: {
      stroke: "stroke-orange-500",
      bg: "stroke-orange-500/20",
      text: "text-orange-600 dark:text-orange-400",
      glow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
      unitBg: "bg-orange-500/10",
    },
    critical: {
      stroke: "stroke-red-500",
      bg: "stroke-red-500/20",
      text: "text-red-600 dark:text-red-400",
      glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]",
      unitBg: "bg-red-500/10",
    },
  };

  const colors = statusColors[status];
  const isBlinking = status === "critical";

  const formattedEndDate = useMemo(() => {
    try {
      return format(endTime, "dd/MM/yyyy בשעה HH:mm", { locale: he });
    } catch {
      return "";
    }
  }, [endTime]);

  return (
    <div className="flex flex-col items-center gap-2" data-testid="circular-countdown-timer">
      <div 
        className={`relative inline-flex items-center justify-center ${isBlinking ? "animate-pulse" : ""}`}
        style={{ width: config.diameter, height: config.diameter }}
      >
        <svg
          className={`transform -rotate-90 ${colors.glow}`}
          width={config.diameter}
          height={config.diameter}
        >
          <circle
            className={colors.bg}
            strokeWidth={config.strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={config.diameter / 2}
            cy={config.diameter / 2}
          />
          <circle
            className={`${colors.stroke} transition-all duration-1000 ease-linear`}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={config.diameter / 2}
            cy={config.diameter / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" dir="rtl">
          <div className="grid grid-cols-2 gap-1 text-center">
            <div className={`flex flex-col items-center px-1 py-0.5 rounded ${colors.unitBg}`}>
              <span className={`${config.fontSize} font-bold ${colors.text} tabular-nums`}>
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              {showLabels && (
                <span className={`${config.labelSize} text-muted-foreground`}>ימים</span>
              )}
            </div>
            <div className={`flex flex-col items-center px-1 py-0.5 rounded ${colors.unitBg}`}>
              <span className={`${config.fontSize} font-bold ${colors.text} tabular-nums`}>
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              {showLabels && (
                <span className={`${config.labelSize} text-muted-foreground`}>שעות</span>
              )}
            </div>
            <div className={`flex flex-col items-center px-1 py-0.5 rounded ${colors.unitBg}`}>
              <span className={`${config.fontSize} font-bold ${colors.text} tabular-nums`}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              {showLabels && (
                <span className={`${config.labelSize} text-muted-foreground`}>דקות</span>
              )}
            </div>
            <div className={`flex flex-col items-center px-1 py-0.5 rounded ${colors.unitBg}`}>
              <span className={`${config.fontSize} font-bold ${colors.text} tabular-nums`}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              {showLabels && (
                <span className={`${config.labelSize} text-muted-foreground`}>שניות</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showEndDate && formattedEndDate && (
        <div className={`${config.unitSize} text-muted-foreground text-center`} dir="rtl">
          <span>נסגר ב-</span>
          <span className="font-medium">{formattedEndDate}</span>
        </div>
      )}
    </div>
  );
}
