import CountdownTimer from '../CountdownTimer';

export default function CountdownTimerExample() {
  const endTime = new Date(Date.now() + 18 * 60 * 60 * 1000 + 34 * 60 * 1000 + 52 * 1000);
  
  return (
    <div className="p-6 space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-2">גודל קטן:</p>
        <CountdownTimer endTime={endTime} size="sm" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">גודל בינוני:</p>
        <CountdownTimer endTime={endTime} size="md" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">גודל גדול:</p>
        <CountdownTimer endTime={endTime} size="lg" />
      </div>
    </div>
  );
}
