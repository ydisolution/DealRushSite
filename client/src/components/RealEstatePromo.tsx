import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingDown, Users, MapPin, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function RealEstatePromo() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-12" dir="rtl">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden border-2 border-purple-200 shadow-xl">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Side - Image/Visual */}
              <div className="relative h-64 md:h-auto bg-gradient-to-br from-[#7B2FF7] to-purple-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10 text-center text-white p-8">
                  <Building2 className="h-24 w-24 mx-auto mb-4" strokeWidth={1.5} />
                  <h3 className="text-3xl font-bold mb-2">חדש!</h3>
                  <p className="text-xl">דירה ראשונה מקבלן</p>
                </div>
              </div>

              {/* Right Side - Content */}
              <CardContent className="p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#7B2FF7] to-purple-600 bg-clip-text text-transparent">
                      קנו יחד, חסכו יותר
                    </h2>
                    <p className="text-lg text-gray-600">
                      הצטרפו לקבוצות רכישה והשיגו הנחות של עד 15% על דירות מקבלן
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Building2 className="h-6 w-6 mx-auto mb-2 text-[#7B2FF7]" />
                      <p className="text-2xl font-bold text-[#7B2FF7]">3</p>
                      <p className="text-xs text-gray-600">פרויקטים</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <TrendingDown className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-green-600">15%</p>
                      <p className="text-xs text-gray-600">חיסכון עד</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-blue-600">3</p>
                      <p className="text-xs text-gray-600">ערים</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-[#7B2FF7] rounded-full"></div>
                      <span>ככל שיותר משפחות מצטרפות - המחיר יורד</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-[#7B2FF7] rounded-full"></div>
                      <span>פרויקטים מאומתים של קבלנים מובילים</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-[#7B2FF7] rounded-full"></div>
                      <span>אפשר להירשם ללא התחייבות</span>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#7B2FF7] to-purple-600 hover:from-purple-600 hover:to-[#7B2FF7] text-lg gap-2 shadow-lg"
                    onClick={() => setLocation("/real-estate")}
                  >
                    לכל הפרויקטים
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    * החיסכון משתנה בהתאם למספר המשפחות שמצטרפות לפרויקט
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
