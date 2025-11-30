import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: Date;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ 
  endTime, 
  size = "md",
  showLabels = true,
  onExpire 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endTime.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const totalHours = difference / (1000 * 60 * 60);
      setIsUrgent(totalHours < 24);

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
      box: "w-8 h-8 text-sm",
      label: "text-[10px]",
      separator: "text-sm",
    },
    md: {
      container: "gap-2",
      box: "w-12 h-12 text-lg font-bold",
      label: "text-xs",
      separator: "text-lg",
    },
    lg: {
      container: "gap-3",
      box: "w-16 h-16 text-2xl font-black",
      label: "text-sm",
      separator: "text-2xl",
    },
  };

  const classes = sizeClasses[size];
  const urgentClass = isUrgent ? "bg-urgent text-urgent-foreground" : "bg-muted text-foreground";

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div 
        className={`${classes.box} ${urgentClass} rounded-md flex items-center justify-center transition-colors`}
        data-testid={`timer-${label}`}
      >
        {formatNumber(value)}
      </div>
      {showLabels && (
        <span className={`${classes.label} text-muted-foreground mt-1`}>{label}</span>
      )}
    </div>
  );

  const Separator = () => (
    <span className={`${classes.separator} ${isUrgent ? "text-urgent" : "text-muted-foreground"} font-bold self-start mt-2`}>:</span>
  );

  return (
    <div className={`flex items-start ${classes.container}`} dir="ltr" data-testid="countdown-timer">
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
