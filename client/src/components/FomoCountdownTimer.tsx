import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, AlertTriangle, Flame, Zap } from "lucide-react";

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

type TimeStatus = "safe" | "warning" | "urgent" | "critical";

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
  const [status, setStatus] = useState<TimeStatus>("safe");

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
      } else if (totalDays < 1) {
        setStatus("urgent");
      } else if (totalDays <= 3) {
        setStatus("warning");
      } else {
        setStatus("safe");
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
      box: "w-14 h-16",
      number: "text-xl",
      label: "text-[9px]",
      message: "text-xs",
      icon: "h-4 w-4",
    },
    md: {
      container: "gap-3",
      box: "w-18 h-20",
      number: "text-2xl",
      label: "text-[10px]",
      message: "text-sm",
      icon: "h-5 w-5",
    },
    lg: {
      container: "gap-4",
      box: "w-22 h-24",
      number: "text-3xl",
      label: "text-xs",
      message: "text-base",
      icon: "h-6 w-6",
    },
  };

  const statusConfig = {
    safe: {
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "shadow-emerald-500/30",
      textColor: "text-emerald-50",
      labelColor: "text-emerald-200",
      message: "יש לכם זמן - אבל אל תפספסו!",
      Icon: Clock,
      pulse: false,
      shake: false,
    },
    warning: {
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "shadow-amber-500/40",
      textColor: "text-amber-50",
      labelColor: "text-amber-200",
      message: "הזמן הולך ואוזל!",
      Icon: AlertTriangle,
      pulse: false,
      shake: false,
    },
    urgent: {
      gradient: "from-orange-500 to-red-600",
      bgGlow: "shadow-orange-500/50",
      textColor: "text-orange-50",
      labelColor: "text-orange-200",
      message: "מהרו! נשארו פחות מ-24 שעות!",
      Icon: Flame,
      pulse: true,
      shake: false,
    },
    critical: {
      gradient: "from-red-500 to-rose-700",
      bgGlow: "shadow-red-500/60",
      textColor: "text-red-50",
      labelColor: "text-red-200",
      message: "הדיל נסגר עכשיו!",
      Icon: Zap,
      pulse: true,
      shake: true,
    },
  };

  const classes = sizeClasses[size];
  const config = statusConfig[status];
  const StatusIcon = config.Icon;

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div 
      className={`
        ${classes.box} 
        flex flex-col items-center justify-center 
        bg-gradient-to-b ${config.gradient}
        rounded-xl
        shadow-lg ${config.bgGlow}
        ${config.pulse ? "animate-pulse" : ""}
        transition-all duration-300
        border border-white/20
      `}
    >
      <span className={`${classes.number} font-black ${config.textColor} tabular-nums drop-shadow-lg`}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={`${classes.label} font-medium ${config.labelColor} uppercase tracking-wider`}>
        {label}
      </span>
    </div>
  );

  const Separator = () => (
    <div className={`flex flex-col justify-center gap-1.5 ${config.pulse ? "animate-pulse" : ""}`}>
      <div className={`w-2 h-2 rounded-full bg-gradient-to-b ${config.gradient} shadow-lg`} />
      <div className={`w-2 h-2 rounded-full bg-gradient-to-b ${config.gradient} shadow-lg`} />
    </div>
  );

  return (
    <div 
      className={`flex flex-col items-center gap-4 ${config.shake ? "animate-[shake_0.5s_ease-in-out_infinite]" : ""}`} 
      data-testid="fomo-countdown-timer"
    >
      <div className={`flex items-center gap-2 ${classes.message} font-bold`}>
        <StatusIcon className={`${classes.icon} ${config.pulse ? "animate-bounce" : ""}`} />
        <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {config.message}
        </span>
      </div>
      
      <div className={`flex items-center ${classes.container}`} dir="ltr">
        <TimeUnit value={timeLeft.days} label="ימים" />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="שעות" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="דקות" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="שניות" />
      </div>
      
      {showEndDate && formattedEndDate && (
        <div className="text-sm text-muted-foreground text-center" dir="rtl">
          <span>נסגר ב-</span>
          <span className="font-semibold">{formattedEndDate}</span>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
