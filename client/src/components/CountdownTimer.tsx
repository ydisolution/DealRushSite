import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: Date;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  centered?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type TimeStatus = "safe" | "warning" | "urgent" | "critical";

export default function CountdownTimer({ 
  endTime, 
  size = "md",
  showLabels = true,
  centered = false,
  onExpire 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [status, setStatus] = useState<TimeStatus>("safe");
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const totalDays = difference / (1000 * 60 * 60 * 24);
      const totalSeconds = difference / 1000;

      if (totalSeconds <= 60) {
        setStatus("critical");
        setIsBlinking(true);
      } else if (totalDays < 1) {
        setStatus("urgent");
        setIsBlinking(false);
      } else if (totalDays <= 3) {
        setStatus("warning");
        setIsBlinking(false);
      } else {
        setStatus("safe");
        setIsBlinking(false);
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
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const sizeClasses = {
    sm: {
      container: "gap-1",
      box: "min-w-[28px] h-7 text-xs font-semibold px-1",
      label: "text-[9px]",
      separator: "text-xs",
    },
    md: {
      container: "gap-1.5",
      box: "min-w-[36px] h-9 text-sm font-bold px-1.5",
      label: "text-[10px]",
      separator: "text-sm",
    },
    lg: {
      container: "gap-2",
      box: "min-w-[48px] h-12 text-lg font-black px-2",
      label: "text-xs",
      separator: "text-lg",
    },
  };

  const statusClasses = {
    safe: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    urgent: "bg-urgent text-urgent-foreground",
    critical: "bg-urgent text-urgent-foreground",
  };

  const classes = sizeClasses[size];
  const colorClass = statusClasses[status];
  const blinkClass = isBlinking ? "animate-pulse" : "";

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div 
        className={`${classes.box} ${colorClass} ${blinkClass} rounded-md flex items-center justify-center transition-colors`}
        data-testid={`timer-${label}`}
      >
        {formatNumber(value)}
      </div>
      {showLabels && (
        <span className={`${classes.label} text-muted-foreground mt-0.5`}>{label}</span>
      )}
    </div>
  );

  const separatorColorClass = {
    safe: "text-success",
    warning: "text-warning",
    urgent: "text-urgent",
    critical: "text-urgent",
  };

  const Separator = () => (
    <span className={`${classes.separator} ${separatorColorClass[status]} ${blinkClass} font-bold self-start mt-1`}>:</span>
  );

  return (
    <div 
      className={`flex items-start ${classes.container} ${centered ? "justify-center" : ""}`} 
      dir="ltr" 
      data-testid="countdown-timer"
    >
      {timeLeft.days > 0 && (
        <>
          <TimeBox value={timeLeft.days} label="ימים" />
          <Separator />
        </>
      )}
      <TimeBox value={timeLeft.hours} label="שעות" />
      <Separator />
      <TimeBox value={timeLeft.minutes} label="דקות" />
      <Separator />
      <TimeBox value={timeLeft.seconds} label="שניות" />
    </div>
  );
}
