import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  target: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning";
}

export default function ProgressBar({ 
  current, 
  target, 
  showLabel = true,
  size = "md",
  variant = "default"
}: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variantClasses = {
    default: "[&>div]:bg-primary",
    success: "[&>div]:bg-success",
    warning: "[&>div]:bg-warning",
  };

  return (
    <div className="w-full" data-testid="progress-bar">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-sm">
          <span className="text-muted-foreground">התקדמות</span>
          <span className="font-medium">
            <span className="text-foreground">{current}</span>
            <span className="text-muted-foreground"> / {target} משתתפים</span>
          </span>
        </div>
      )}
      <Progress 
        value={percentage} 
        className={`${sizeClasses[size]} ${variantClasses[variant]} bg-muted`}
      />
    </div>
  );
}
