import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  TrendingDown, 
  Users, 
  Filter,
  X,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

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
}

interface RealEstateProject {
  id: string;
  title: string;
  slug: string;
  city: string;
  region: string;
  coverImage: string | null;
  marketPriceBaseline: number;
  currentPrice: number;
  developer: Developer;
  registrantCount: number;
  tiers: ProjectTier[];
  currentTier: ProjectTier | null;
  nextTier: ProjectTier | null;
  highlights: string[];
  currentStage: string;
}

function getStageLabel(stage: string): string {
  const stageLabels: Record<string, string> = {
    "PRE_REGISTRATION": "רישום מקדים",
    "WEBINAR_SCHEDULED": "כנס רוכשים",
    "FOMO_CONFIRMATION_WINDOW": "רישום סופי",
    "REGISTRATION_CLOSED": "בחירת נכס וחתימת חוזה",
  };
  return stageLabels[stage] || "רישום מקדים";
}

export default function RealEstatePage() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    city: "",
    region: "",
    minPrice: "",
    maxPrice: "",
    status: "open",
  });

  const { data, isLoading } = useQuery<{
    projects: RealEstateProject[];
    pagination: any;
  }>({
    queryKey: ["/api/real-estate/projects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await fetch(`/api/real-estate/projects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const { data: cities = [] } = useQuery<string[]>({
    queryKey: ["/api/real-estate/cities"],
  });

  const clearFilters = () => {
    setFilters({
      city: "",
      region: "",
      minPrice: "",
      maxPrice: "",
      status: "open",
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "open").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50" dir="rtl">
      {/* Hero Section - Styled like the image */}
      <div className="bg-gradient-to-br from-gray-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden shadow-2xl">
              <div className="grid md:grid-cols-2">
                {/* Right Side - Content (White Background) */}
                <div className="bg-white p-8 md:p-12 order-2 md:order-1">
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#7B2FF7] to-purple-600 bg-clip-text text-transparent">
                        קנו יחד, חסכו יותר
                      </h1>
                      <p className="text-lg text-gray-600">
                        הצטרפו לקבוצות רכישה והשיגו הנחות של עד 15% על דירות מקבלן
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-3xl font-bold text-blue-600">3</p>
                        <p className="text-sm text-gray-600">ערים</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <TrendingDown className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-3xl font-bold text-green-600">15%</p>
                        <p className="text-sm text-gray-600">חיסכון עד</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-[#7B2FF7]" />
                        <p className="text-3xl font-bold text-[#7B2FF7]">3</p>
                        <p className="text-sm text-gray-600">פרויקטים</p>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-[#7B2FF7] rounded-full flex-shrink-0"></div>
                        <span>ככל שיותר משפחות מצטרפות - המחיר יורד</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-[#7B2FF7] rounded-full flex-shrink-0"></div>
                        <span>פרויקטים מאומתים של קבלנים מובילים</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-2 h-2 bg-[#7B2FF7] rounded-full flex-shrink-0"></div>
                        <span>אפשר להירשם ללא התחייבות</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7] text-lg gap-2 shadow-lg"
                      onClick={() => document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      לכל הפרויקטים
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      * החיסכון משתנה בהתאם למספר המשפחות שמצטרפות לפרויקט
                    </p>
                  </div>
                </div>

                {/* Left Side - Visual (Purple Background) */}
                <div className="relative bg-gradient-to-br from-[#7B2FF7] to-purple-600 flex items-center justify-center p-12 order-1 md:order-2 min-h-[400px]">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative z-10 text-center text-white">
                    <Building2 className="h-32 w-32 mx-auto mb-6" strokeWidth={1.5} />
                    <h2 className="text-4xl font-bold mb-3">חדש!</h2>
                    <p className="text-2xl">דירה ראשונה מקבלן</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <div id="projects-section" className="container mx-auto px-4 py-8">
        {/* Filter Bar - Always Visible */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-6 w-6 text-[#7B2FF7]" />
              <h2 className="text-xl font-bold">סינון פרויקטים</h2>
              {activeFilterCount > 0 && (
                <>
                  <Badge className="bg-[#7B2FF7]">{activeFilterCount} פילטרים פעילים</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 text-[#7B2FF7] hover:text-purple-600 hover:bg-purple-100 mr-auto"
                  >
                    <X className="h-4 w-4" />
                    נקה הכל
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">עיר</label>
                <select
                  className="w-full border-2 border-purple-200 rounded-lg p-3 focus:border-[#7B2FF7] focus:ring-2 focus:ring-purple-200 transition-all"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                >
                  <option value="">כל הערים</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">אזור</label>
                <select
                  className="w-full border-2 border-purple-200 rounded-lg p-3 focus:border-[#7B2FF7] focus:ring-2 focus:ring-purple-200 transition-all"
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                >
                  <option value="">כל האזורים</option>
                  <option value="צפון">צפון</option>
                  <option value="מרכז">מרכז</option>
                  <option value="דרום">דרום</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">מחיר מינימום</label>
                <input
                  type="number"
                  className="w-full border-2 border-purple-200 rounded-lg p-3 focus:border-[#7B2FF7] focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="מ-₪"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">מחיר מקסימום</label>
                <input
                  type="number"
                  className="w-full border-2 border-purple-200 rounded-lg p-3 focus:border-[#7B2FF7] focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="עד-₪"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.projects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">לא נמצאו פרויקטים</p>
            <Button onClick={clearFilters} className="mt-4">
              נקה פילטרים
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-xl transition-shadow overflow-hidden"
                  onClick={() => setLocation(`/real-estate/${project.slug}`)}
                >
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.coverImage || "https://placehold.co/800x600/667eea/ffffff?text=Project"}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 text-white">
                        {getStageLabel(project.currentStage)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    {/* Title & Location */}
                    <h3 className="text-xl font-bold mb-2 text-right">{project.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{project.city}</span>
                    </div>

                    {/* Developer */}
                    <p className="text-sm text-gray-500 mb-3">
                      קבלן: {project.developer.name}
                    </p>

                    {/* Pricing */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">מחיר שוק (בסיס):</span>
                        <span className="line-through text-gray-400">
                          מ־₪{project.marketPriceBaseline.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">הנחה נוכחית:</span>
                        <span className="text-2xl font-bold text-[#7B2FF7]">
                          {project.currentTier?.savingsPercent || project.tiers[0]?.savingsPercent || 0}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        * מחושב על מחיר הדירה בפועל
                      </p>
                    </div>

                    {/* Tier Progress */}
                    {project.nextTier && (
                      <div className="bg-purple-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-600">
                            <Users className="h-3 w-3 inline mr-1" />
                            {project.registrantCount} נרשמו
                          </span>
                          <span className="font-bold text-[#7B2FF7]">
                            עוד {project.nextTier.thresholdRegistrants - project.registrantCount} למדרגה הבאה
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#7B2FF7] to-purple-600 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((project.registrantCount / project.nextTier.thresholdRegistrants) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {project.highlights && project.highlights.length > 0 && (
                      <div className="space-y-2 mb-4 bg-purple-50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-[#7B2FF7] mb-2">הטבות:</h4>
                        {project.highlights.slice(0, 3).map((highlight, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="text-[#7B2FF7] font-bold mt-0.5">•</span>
                            <span className="font-medium">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Button className="w-full bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7]">
                      לפרטים ולהרשמה
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
