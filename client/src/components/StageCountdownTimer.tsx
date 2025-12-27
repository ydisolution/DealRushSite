import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface StageCountdownTimerProps {
  endDate: string | null;
  stageName: string;
}

export default function StageCountdownTimer({ endDate, stageName }: StageCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate || timeLeft === null) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-red-600 animate-pulse" />
        <h3 className="text-sm font-bold text-gray-800">זמן לסיום {stageName}</h3>
      </div>
      
      <div className="text-center mb-2">
        <p className="text-xs text-gray-600 mb-2">
          נותרו עד {new Date(endDate).toLocaleDateString('he-IL')}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-lg p-2 shadow-sm">
          <div className="text-2xl font-bold text-red-600 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">שניות</div>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">דקות</div>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-gray-600">שעות</div>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{timeLeft.days}</div>
          <div className="text-xs text-gray-600">ימים</div>
        </div>
      </div>
    </div>
  );
}
