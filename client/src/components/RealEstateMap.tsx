import { useState } from "react";
import { MapPin, Building2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface Project {
  id: string;
  title: string;
  slug: string;
  city: string;
  region: string;
  latitude?: string;
  longitude?: string;
  coverImage?: string;
  currentStage: string;
  marketPriceBaseline: number;
  registrantCount: number;
  presentationEventDate?: string;
  finalRegistrationEnd?: string;
}

interface RealEstateMapProps {
  projects: Project[];
}

const stageLabels: Record<string, string> = {
  EARLY_REGISTRATION: "רישום מוקדם",
  PRESENTATION: "הצגת הפרויקט",
  FINAL_REGISTRATION: "רישום לרכישה",
  POST_REGISTRATION: "בחירה וחתימה",
};

// Israel regions with approximate center coordinates
const regions = {
  צפון: { lat: 32.8, lng: 35.2, label: "צפון" },
  מרכז: { lat: 32.0, lng: 34.8, label: "מרכז" },
  דרום: { lat: 31.0, lng: 34.8, label: "דרום" },
};

export default function RealEstateMap({ projects }: RealEstateMapProps) {
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [, setLocation] = useLocation();

  // Group projects by region since we don't have exact coordinates
  const projectsByRegion = projects.reduce((acc, project) => {
    const region = project.region as keyof typeof regions;
    if (!acc[region]) acc[region] = [];
    acc[region].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const handleProjectClick = (project: Project) => {
    setLocation(`/real-estate/${project.slug}`);
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden" dir="rtl">
      {/* Simple Israel Map Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg viewBox="0 0 200 400" className="w-full h-full">
          {/* Simplified Israel shape */}
          <path
            d="M 100 50 L 120 80 L 130 120 L 125 180 L 115 250 L 100 320 L 90 350 L 85 320 L 80 250 L 75 180 L 70 120 L 80 80 Z"
            fill="currentColor"
            className="text-gray-400"
          />
        </svg>
      </div>

      {/* Region Markers */}
      <div className="relative h-full flex flex-col justify-around p-8">
        {Object.entries(regions).map(([regionKey, regionData]) => {
          const regionProjects = projectsByRegion[regionKey] || [];
          
          return (
            <div key={regionKey} className="relative">
              {/* Region Label */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold">{regionData.label}</h3>
                <Badge variant="outline">{regionProjects.length} פרויקטים</Badge>
              </div>

              {/* Projects in this region */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                    onMouseEnter={() => setHoveredProject(project)}
                    onMouseLeave={() => setHoveredProject(null)}
                    onClick={() => handleProjectClick(project)}
                  >
                    <CardContent className="p-4">
                      {/* Image */}
                      {project.coverImage && (
                        <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                          <img
                            src={project.coverImage}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge
                              className={`
                                ${project.currentStage === "FINAL_REGISTRATION"
                                  ? "bg-orange-500"
                                  : "bg-purple-500"
                                } text-white
                              `}
                            >
                              {stageLabels[project.currentStage]}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm line-clamp-1">{project.title}</h4>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{project.city}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Building2 className="h-3 w-3" />
                          <span>{project.registrantCount} נרשמו</span>
                        </div>

                        {/* Next Date */}
                        {(project.presentationEventDate || project.finalRegistrationEnd) && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {project.currentStage === "FINAL_REGISTRATION" && project.finalRegistrationEnd
                                ? `נסגר: ${new Date(project.finalRegistrationEnd).toLocaleDateString('he-IL')}`
                                : project.presentationEventDate
                                ? `מצגת: ${new Date(project.presentationEventDate).toLocaleDateString('he-IL')}`
                                : ""}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="text-lg font-bold text-purple-700">
                          ₪{project.marketPriceBaseline.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Preview (if needed for larger screens) */}
      {hoveredProject && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm hidden lg:block">
          <h4 className="font-bold mb-2">{hoveredProject.title}</h4>
          <p className="text-sm text-gray-600">{hoveredProject.city}</p>
          <p className="text-xs text-gray-500 mt-2">לחץ לפרטים מלאים</p>
        </div>
      )}
    </div>
  );
}
