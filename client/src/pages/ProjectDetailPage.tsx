import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  currentStage: string; // Added to match backend
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const { data: project, isLoading } = useQuery<RealEstateProject>({
    queryKey: [`/api/real-estate/projects/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/real-estate/projects/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!slug,
  });

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card className="overflow-hidden">
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

            {/* Project Info */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-3">{project.title}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span>{project.addressText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>מסירה: {new Date(project.expectedDeliveryDate).toLocaleDateString("he-IL")}</span>
                    </div>
                  </div>
                </div>

                {/* Developer */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {project.developer.logo && (
                    <img src={project.developer.logo} alt={project.developer.name} className="h-12" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500">קבלן מבצע</p>
                    <p className="font-bold text-lg">{project.developer.name}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold mb-3">על הפרויקט</h3>
                  <div className="space-y-2">
                    {project.description.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0 text-[#7B2FF7]" />
                          <span className="text-gray-700">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Highlights */}
                {project.highlights && project.highlights.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">נקודות חוזק</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {project.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          <ChevronRight className="h-4 w-4 text-[#7B2FF7]" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Types */}
                {project.propertyTypes && project.propertyTypes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">סוגי דירות בפרויקט</h3>
                    <div className="space-y-3">
                      {project.propertyTypes.map((type, idx) => {
                        const price = type.startingFromPrice || type.marketPrice || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center p-4 bg-gradient-to-l from-purple-50 to-white rounded-lg border border-purple-100">
                            <div>
                              <p className="font-bold text-lg">{type.type} חדרים</p>
                              <p className="text-sm text-gray-500">{type.count} יחידות זמינות</p>
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-gray-500 mb-1">מתחיל מ־</p>
                              <p className="text-2xl font-bold text-[#7B2FF7]">
                                ₪{price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 pr-2">
                      * מחירים אלו הם לצורך מחשה בלבד. המחיר המדויק נקבע ע"'י הקבלן.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tier Ladder */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">סולם הנחות לפי כמות נרשמים</h3>
                <p className="text-sm text-gray-600 mb-4">
                  ההנחות מבוססות על אחוזים ומחושבות על מחיר הדירה בפועל שנקבע על ידי הקבלן
                </p>
                <div className="space-y-3">
                  {project.tiers.map((tier, idx) => {
                    const isActive = project.registrantCount >= tier.thresholdRegistrants;
                    const isCurrent = project.currentTier?.id === tier.id;
                    
                    // Calculate estimated savings based on lowest apartment type
                    const lowestPrice = project.propertyTypes.length > 0 
                      ? Math.min(...project.propertyTypes.map(t => t.startingFromPrice || t.marketPrice || 0))
                      : project.marketPriceBaseline;
                    const estimatedSavings = Math.round(lowestPrice * (tier.savingsPercent / 100));
                    
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
                                {tier.thresholdRegistrants} נרשמים ומעלה
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-[#7B2FF7]">
                              {tier.savingsPercent}% הנחה
                            </p>
                            <p className="text-xs text-gray-500">
                              (מתחיל מ-~₪{estimatedSavings.toLocaleString()})
                            </p>
                          </div>
                        </div>
                        {tier.benefits && tier.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {tier.benefits.map((benefit, bidx) => (
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

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">מחיר שוק (בסיס)</p>
                  <p className="text-xl line-through text-gray-400">
                    מ-₪{project.marketPriceBaseline.toLocaleString()}
                  </p>
                </div>

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

                <Button 
                  className="w-full bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7] text-lg py-6"
                  onClick={() => setShowRegistrationForm(true)}
                >
                  אני רוצה להירשם
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <TrendingDown className="h-4 w-4 inline ml-1" />
                  ככל שיותר אנשים נרשמים - המחיר יורד!
                </div>
              </CardContent>
            </Card>

            {/* Developer Contact */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">צור קשר עם הקבלן</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">{project.developer.description}</p>
                  {project.developer.contactPhone && (
                    <p className="text-gray-700">
                      <strong>טלפון:</strong> {project.developer.contactPhone}
                    </p>
                  )}
                  {project.developer.contactEmail && (
                    <p className="text-gray-700">
                      <strong>אימייל:</strong> {project.developer.contactEmail}
                    </p>
                  )}
                  {project.developer.website && (
                    <a 
                      href={project.developer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7B2FF7] hover:underline block"
                    >
                      אתר הקבלן →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
