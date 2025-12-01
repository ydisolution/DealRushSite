import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface FomoCountdownTimerProps {
  endTime: Date | string;
  size?: "sm" | "md" | "lg";
  showEndDate?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FomoCountdownTimer({ 
  endTime: endTimeProp, 
  size = "md",
  showEndDate = false,
  onExpire 
}: FomoCountdownTimerProps) {
  const endTime = useMemo(() => {
    return typeof endTimeProp === 'string' ? new Date(endTimeProp) : endTimeProp;
  }, [endTimeProp]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 150);
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  const formattedEndDate = useMemo(() => {
    try {
      return format(endTime, "dd/MM/yyyy בשעה HH:mm", { locale: he });
    } catch {
      return "";
    }
  }, [endTime]);

  const sizeClasses = {
    sm: {
      container: "gap-2",
      box: "w-12 h-14",
      number: "text-lg",
      label: "text-[9px]",
      separator: "text-lg",
    },
    md: {
      container: "gap-3",
      box: "w-16 h-20",
      number: "text-2xl",
      label: "text-[10px]",
      separator: "text-xl",
    },
    lg: {
      container: "gap-4",
      box: "w-20 h-24",
      number: "text-3xl",
      label: "text-xs",
      separator: "text-2xl",
    },
  };

  const classes = sizeClasses[size];

  const TimeUnit = ({ value, label, isSeconds = false }: { value: number; label: string; isSeconds?: boolean }) => (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`
          ${classes.box} 
          flex items-center justify-center 
          bg-card
          rounded-xl
          border border-border
          shadow-sm
          relative
          overflow-hidden
        `}
      >
        <span 
          className={`
            ${classes.number} 
            font-bold 
            text-foreground 
            tabular-nums
            transition-all duration-150 ease-out
            ${isSeconds && isFlipping ? "scale-110 text-primary" : "scale-100"}
          `}
        >
          {String(value).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/30" />
      </div>
      <span className={`${classes.label} font-medium text-muted-foreground uppercase tracking-wide`}>
        {label}
      </span>
    </div>
  );

  const Separator = () => (
    <div className={`flex items-center justify-center h-14 ${classes.separator} font-light text-muted-foreground/50`}>
      :
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4" data-testid="fomo-countdown-timer">
      <div className={`flex items-start ${classes.container}`} dir="ltr">
        <TimeUnit value={timeLeft.days} label="ימים" />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="שעות" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="דקות" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="שניות" isSeconds />
      </div>
      
      {showEndDate && formattedEndDate && (
        <div className="text-sm text-muted-foreground text-center" dir="rtl">
          <span>נסגר ב-</span>
          <span className="font-medium">{formattedEndDate}</span>
        </div>
      )}
    </div>
  );
}
