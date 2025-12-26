import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";

interface PriceSimulatorProps {
  originalPrice: number;
  tierDiscount: number;
  onDeltaChange?: (delta: number) => void;
}

export default function PriceSimulator({ originalPrice, tierDiscount, onDeltaChange }: PriceSimulatorProps) {
  const [priceDelta, setPriceDelta] = useState(4);
  const [unitsCount, setUnitsCount] = useState(10);

  const basePrice = Math.round(originalPrice * (1 - tierDiscount / 100));
  const maxDiscount = priceDelta / 2; // 2% ברירת מחדל
  
  const simulatedPrices = Array.from({ length: unitsCount }, (_, index) => {
    const position = index + 1;
    const positionDiscount = maxDiscount - ((position - 1) / (unitsCount - 1)) * priceDelta;
    const price = Math.round(basePrice * (1 - positionDiscount / 100));
    
    return {
      position,
      price,
      positionDiscount,
      differenceFromPrevious: index > 0 
        ? price - Math.round(basePrice * (1 - (maxDiscount - ((position - 2) / (unitsCount - 1)) * priceDelta) / 100))
        : 0,
    };
  });

  const avgPrice = Math.round(simulatedPrices.reduce((sum, p) => sum + p.price, 0) / simulatedPrices.length);
  const totalRevenue = simulatedPrices.reduce((sum, p) => sum + p.price, 0);

  const handleDeltaChange = (newDelta: number) => {
    setPriceDelta(newDelta);
    if (onDeltaChange) {
      onDeltaChange(newDelta);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
        <CardTitle className="flex items-center gap-2 text-[#7B2FF7]">
          <Calculator className="h-5 w-5" />
          סימולטור תמחור דינמי
        </CardTitle>
        <CardDescription>
          חשב את התפלגות המחירים לפי מספר משתתפים ואחוז דלתא
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* הגדרות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>מחיר מקורי</Label>
            <Input 
              type="text" 
              value={`₪${originalPrice.toLocaleString()}`} 
              disabled 
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label>אחוז הנחה במדרגה</Label>
            <Input 
              type="text" 
              value={`${tierDiscount}%`} 
              disabled 
              className="bg-gray-50"
            />
          </div>
          
          <div className="space-y-2">
            <Label>מחיר בסיס (ממוצע)</Label>
            <Input 
              type="text" 
              value={`₪${basePrice.toLocaleString()}`} 
              disabled 
              className="bg-gray-50 font-bold text-[#7B2FF7]"
            />
          </div>
        </div>

        {/* הגדרות דינמיות */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="priceDelta" className="font-semibold">
              אחוז דלתא (%) - הפרש בין ראשון לאחרון
            </Label>
            <div className="flex gap-2">
              <Input 
                id="priceDelta"
                type="number" 
                min="0"
                max="20"
                step="0.5"
                value={priceDelta} 
                onChange={(e) => handleDeltaChange(parseFloat(e.target.value) || 0)}
                className="font-bold"
              />
              <Badge variant="secondary" className="px-3">
                ±{priceDelta / 2}%
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              הראשון: -{priceDelta / 2}% | האחרון: +{priceDelta / 2}%
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitsCount" className="font-semibold">
              כמות יחידות בסימולציה
            </Label>
            <Input 
              id="unitsCount"
              type="number" 
              min="2"
              max="100"
              value={unitsCount} 
              onChange={(e) => setUnitsCount(parseInt(e.target.value) || 2)}
              className="font-bold"
            />
          </div>
        </div>

        {/* סיכום */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">מחיר ממוצע</p>
            <p className="text-2xl font-bold text-[#7B2FF7]">₪{avgPrice.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">סה"כ הכנסות</p>
            <p className="text-2xl font-bold text-green-600">₪{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">הפרש מקס</p>
            <p className="text-2xl font-bold text-orange-600">
              ₪{(simulatedPrices[simulatedPrices.length - 1].price - simulatedPrices[0].price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* טבלת מחירים */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#7B2FF7]" />
            התפלגות מחירים לפי מיקום
          </h4>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-right font-semibold">מיקום</th>
                  <th className="p-3 text-right font-semibold">מחיר</th>
                  <th className="p-3 text-right font-semibold">אחוז מיקום</th>
                  <th className="p-3 text-right font-semibold">הפרש מקודם</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {simulatedPrices.map((item) => {
                  const isFirst = item.position === 1;
                  const isLast = item.position === unitsCount;
                  const isBelowAvg = item.price < avgPrice;
                  
                  return (
                    <tr 
                      key={item.position}
                      className={`hover:bg-purple-50 ${isFirst ? 'bg-green-50' : ''} ${isLast ? 'bg-red-50' : ''}`}
                    >
                      <td className="p-3 font-bold">
                        #{item.position}
                        {isFirst && <Badge className="mr-2 bg-green-500">ראשון</Badge>}
                        {isLast && <Badge className="mr-2 bg-red-500">אחרון</Badge>}
                      </td>
                      <td className="p-3 font-bold text-[#7B2FF7]">
                        ₪{item.price.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {isBelowAvg ? (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          )}
                          <span className={isBelowAvg ? 'text-green-600' : 'text-red-600'}>
                            {item.positionDiscount > 0 ? '-' : '+'}{Math.abs(item.positionDiscount).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        {item.position > 1 ? (
                          <span className={item.differenceFromPrevious > 0 ? 'text-red-500' : 'text-green-500'}>
                            {item.differenceFromPrevious > 0 ? '+' : ''}₪{item.differenceFromPrevious.toLocaleString()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
