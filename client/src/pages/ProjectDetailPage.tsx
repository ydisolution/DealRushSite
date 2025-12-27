import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Building2, 
  Calendar,
  TrendingDown,
  Users,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import GuidedHelpBar from "@/components/GuidedHelpBar";
import RealEstateLegalDisclaimer from "@/components/RealEstateLegalDisclaimer";
import StageStepper from "@/components/StageStepper";
import RealEstateProjectManager from "@/components/RealEstateProjectManager";
import RealEstatePreRegister from "@/components/RealEstatePreRegister";
import StageCountdownTimer from "@/components/StageCountdownTimer";

interface PropertyType {
  type: string;
  count: number;
  startingFromPrice?: number;
  marketPrice?: number; // backward compatibility
}

interface ProjectTier {
  id: string;
  name: string;
  thresholdRegistrants: number;
  fromPrice: number;
  savings: number;
  savingsPercent: number;
  benefits: string[];
}

interface Developer {
  id: string;
  name: string;
  logo: string | null;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

interface RealEstateProject {
  id: string;
  title: string;
  slug: string;
  city: string;
  region: string;
  addressText: string;
  coverImage: string | null;
  gallery: string[];
  description: string;
  highlights: string[];
  propertyTypes: PropertyType[];
  marketPriceBaseline: number;
  currentPrice: number;
  expectedDeliveryDate: string;
  developer: Developer;
  registrantCount: number;
  tiers: ProjectTier[];
  currentTier: ProjectTier | null;
  nextTier: ProjectTier | null;
  currentStage: string;
  // Stage deadline dates
  earlyRegistrationEnd: string | null;
  webinarDeadline: string | null;
  finalRegistrationEnd: string | null;
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { data: project, isLoading } = useQuery<RealEstateProject>({
    queryKey: [`/api/real-estate/projects/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/real-estate/projects/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!slug,
  });

  // Determine current stage deadline and name
  const getStageDeadline = () => {
    if (!project) return { deadline: null, stageName: '' };
    
    switch (project.currentStage) {
      case 'PRE_REGISTRATION':
        return { deadline: project.earlyRegistrationEnd, stageName: 'רישום מקדים' };
      case 'WEBINAR_SCHEDULED':
        return { deadline: project.webinarDeadline, stageName: 'כנס רוכשים' };
      case 'FOMO_CONFIRMATION_WINDOW':
        return { deadline: project.finalRegistrationEnd, stageName: 'רישום סופי' };
      case 'REGISTRATION_CLOSED':
        return { deadline: null, stageName: '' }; // No timer for final stage
      default:
        return { deadline: null, stageName: '' };
    }
  };

  const { deadline, stageName } = getStageDeadline();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B2FF7]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">פרויקט לא נמצא</h2>
          <p className="text-gray-500 mb-4">הפרויקט שחיפשת אינו קיים או הוסר</p>
          <Button onClick={() => setLocation("/real-estate")}>
            חזרה לכל הפרויקטים
          </Button>
        </Card>
      </div>
    );
  }

  const allImages = [project.coverImage, ...project.gallery].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 relative" dir="rtl">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 md:px-4 py-3">
          <button
            onClick={() => setLocation("/real-estate")}
            className="flex items-center gap-2 text-gray-600 hover:text-[#7B2FF7] transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה לכל הפרויקטים</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Process Bar - Mobile friendly */}
        <div className="mb-6 md:mb-8">
          <StageStepper currentStage={project.currentStage} />
        </div>

        {/* Project Title & Basic Info - Full Width - Thin Card */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4">
            <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{project.addressText}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>מסירה: {new Date(project.expectedDeliveryDate).toLocaleDateString("he-IL")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-gray-700">קבלן מבצע: {project.developer.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-0 lg:items-start">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Gallery */}
            <Card className="overflow-hidden h-full">
              <div className="relative h-64 md:h-96">
                <img
                  src={allImages[selectedImage] || "https://placehold.co/800x600/667eea/ffffff?text=Project"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 md:top-4 right-3 md:right-4">
                  <Badge className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 text-white text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
                    חסכו עד {project.tiers[project.tiers.length - 1]?.savingsPercent}%
                  </Badge>
                </div>
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 md:p-4 overflow-x-auto">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                        selectedImage === idx ? "border-[#7B2FF7] scale-105" : "border-gray-200"
                      }`}
                    >
                      <img src={img || ""} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6 lg:pr-6">
            {/* Price Card */}
            <Card className="h-full flex flex-col">
              <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">עם ההנחה הנוכחית</p>
                    <p className="text-4xl font-bold text-[#7B2FF7]">
                      {project.currentTier?.savingsPercent || project.tiers[0]?.savingsPercent}% הנחה
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      * מחושב על מחיר הדירה בפועל
                    </p>
                  </div>

                  {/* Progress to Next Tier */}
                  {project.nextTier && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          <Users className="h-4 w-4 inline ml-1" />
                          {project.registrantCount} נרשמו
                        </span>
                        <span className="font-bold text-[#7B2FF7]">
                          עוד {project.nextTier.thresholdRegistrants - project.registrantCount} ל-{project.nextTier.savingsPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((project.registrantCount / project.nextTier.thresholdRegistrants) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Stage Countdown Timer */}
                  {deadline && stageName && (
                    <StageCountdownTimer 
                      endDate={deadline} 
                      stageName={stageName}
                    />
                  )}

                  <Button 
                    className="w-full bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7] text-lg py-6"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    רישום לקבוצת רוכשים
                  </Button>

                  <div className="text-center text-sm text-gray-500">
                    <TrendingDown className="h-4 w-4 inline ml-1" />
                    ככל שיותר אנשים נרשמים - המחיר יורד!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Width Content Below */}
        <div className="space-y-6 mt-6 md:mt-8">
          {/* About Project - Full Width */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3">על הפרויקט</h3>
                <div className="space-y-2">
                  {project.description.split('\n').map((line: string, idx: number) => {
                    if (!line.trim()) return null;
                    
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0 text-[#7B2FF7]" />
                        <span className="text-gray-700">{line}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legal Trust Line */}
                <div className="mt-4 p-4 bg-blue-50 border-r-4 border-blue-500 rounded">
                  <p className="text-sm text-blue-900 font-medium">
                    🛡️ הקבוצה מלוּוה בליווי משפטי צמוד על ידי משרד עורכי דין חיצוני, שאינו מטעם הקבלן.
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {project.highlights && project.highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-3">נקודות חוזק</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {project.highlights.map((highlight: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <ChevronRight className="h-4 w-4 text-[#7B2FF7]" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Types - Card Layout */}
              {project.propertyTypes && project.propertyTypes.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">סוגי דירות בפרויקט</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                    {project.propertyTypes.map((type: PropertyType, idx: number) => {
                      const price = type.startingFromPrice || type.marketPrice || 0;
                      return (
                        <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-5 text-center space-y-3">
                            <div className="bg-gradient-to-br from-[#7B2FF7] to-purple-600 text-white rounded-lg py-3 px-4">
                              <h4 className="text-2xl font-bold">{type.type}</h4>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">החל מ-</p>
                              <p className="text-2xl font-bold text-[#7B2FF7]">
                                ₪{price.toLocaleString()}
                              </p>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">מלאי:</span> {type.count} יחידות
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    * מחירים אלו הם לצורך מחשה בלבד. המחיר המדויק נקבע ע"י הקבלן.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier Ladder - Full Width */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">סולם הנחות לפי כמות נרשמים</h3>
              <p className="text-sm text-gray-600 mb-4">
                ההנחות מבוססות על אחוזים ומחושבות על מחיר הדירה בפועל שנקבע על ידי הקבלן
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.tiers.map((tier: any, idx: number) => {
                  const isActive = project.registrantCount >= tier.thresholdRegistrants;
                  const isCurrent = project.currentTier?.id === tier.id;
                  
                  return (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? "border-[#7B2FF7] bg-purple-50"
                          : isActive
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            isCurrent ? "bg-[#7B2FF7] text-white" : isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold">{tier.name}</p>
                            <p className="text-sm text-gray-500">
                              נפתח ב-{tier.thresholdRegistrants} נרשמים
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-3xl font-bold text-[#7B2FF7]">
                            {tier.savingsPercent}%
                          </p>
                          <p className="text-xs text-gray-500">הנחה</p>
                        </div>
                      </div>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tier.benefits.map((benefit: string, bidx: number) => (
                            <Badge key={bidx} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Legal Disclaimer in Tier Section */}
              <div className="mt-6">
                <RealEstateLegalDisclaimer variant="compact" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Estate Project Manager - Full Width Section */}
        <div className="mt-8">
          <RealEstateProjectManager projectSlug={project.slug} />
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              רישום לקבוצת רוכשים - {project.title}
            </DialogTitle>
          </DialogHeader>
          <RealEstatePreRegister
            projectSlug={project.slug}
            projectTitle={project.title}
            totalCapacity={project.totalCapacity}
            currentRegistrantCount={project.currentRegistrantCount}
            onSuccess={() => {
              setIsRegisterModalOpen(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
