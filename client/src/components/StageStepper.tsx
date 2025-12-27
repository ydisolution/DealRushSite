import { Check } from "lucide-react";

interface StageStepperProps {
  currentStage: string;
}

export default function StageStepper({ currentStage }: StageStepperProps) {
  const stages = [
    { id: "PRE_REGISTRATION", label: "רישום מקדים", shortLabel: "רישום מקדים" },
    { id: "WEBINAR_SCHEDULED", label: "כנס רוכשים", shortLabel: "כנס רוכשים" },
    { id: "FOMO_CONFIRMATION_WINDOW", label: "רישום סופי", shortLabel: "רישום סופי" },
    { id: "REGISTRATION_CLOSED", label: "בחירת נכס וחתימת חוזה", shortLabel: "בחירת נכס וחתימת חוזה" },
  ];

  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full py-4 md:py-6" dir="rtl">
      <div className="flex items-center justify-between relative px-2 md:px-0">
        {/* Progress Line */}
        <div className="absolute top-5 right-0 left-0 h-1 bg-gray-200 mx-4 md:mx-0">
          <div
            className="h-full bg-[#7B2FF7] transition-all duration-500"
            style={{
              width: `${(currentIndex / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={stage.id} className="flex flex-col items-center relative z-10 flex-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-white border-[#7B2FF7]"
                    : isCurrent
                    ? "bg-white border-[#7B2FF7] ring-4 ring-purple-100"
                    : "bg-white border-gray-300"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                ) : (
                  <span
                    className={`text-xs md:text-sm font-bold ${
                      isCurrent ? "text-[#7B2FF7]" : "text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <p
                className={`mt-2 text-[10px] md:text-xs text-center font-medium max-w-[90px] md:max-w-[120px] leading-tight whitespace-nowrap ${
                  isCurrent ? "text-[#7B2FF7]" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
