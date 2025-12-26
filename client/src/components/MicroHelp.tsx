import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

interface MicroHelpProps {
  topic: string;
  customContent?: string;
}

export default function MicroHelp({ topic, customContent }: MicroHelpProps) {
  const { data } = useQuery({
    queryKey: [`/api/ai/quick-help/${topic}`],
    enabled: !customContent,
  });

  const helpText = customContent || data?.help || "טוען...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-[#7B2FF7] transition-colors cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white border shadow-lg p-3" dir="rtl">
          <p className="text-sm text-gray-700 leading-relaxed">{helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
