import { useLocation } from "wouter";
import HowItWorksPage from "@/components/HowItWorksPage";

export default function HowItWorksPageRoute() {
  const [, setLocation] = useLocation();

  return (
    <HowItWorksPage 
      onGetStarted={() => setLocation('/')}
    />
  );
}
