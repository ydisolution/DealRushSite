import CountdownTimer from '../CountdownTimer';

export default function CountdownTimerExample() {
  const moreThan3Days = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const lessThan3Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const lessThan1Day = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const lastMinute = new Date(Date.now() + 45 * 1000);
  
  return (
    <div className="p-6 space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-2">יותר מ-3 ימים (ירוק):</p>
        <CountdownTimer endTime={moreThan3Days} size="md" centered />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">1-3 ימים (כתום):</p>
        <CountdownTimer endTime={lessThan3Days} size="md" centered />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">פחות מיום (אדום):</p>
        <CountdownTimer endTime={lessThan1Day} size="md" centered />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">דקה אחרונה (מהבהב):</p>
        <CountdownTimer endTime={lastMinute} size="md" centered />
      </div>
    </div>
  );
}
