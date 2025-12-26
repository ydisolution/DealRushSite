import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface ConfirmParticipationFormProps {
  projectSlug: string;
  projectTitle: string;
  apartmentTypes: Array<{ type: string; count: number; startingFromPrice: number }>;
  onSuccess?: () => void;
}

export default function RealEstateConfirmParticipation({
  projectSlug,
  projectTitle,
  apartmentTypes,
  onSuccess,
}: ConfirmParticipationFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    apartmentType: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/real-estate/projects/${projectSlug}/confirm-participation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "שגיאה באישור השתתפות");
      }

      return res.json();
    },
    onSuccess: (data) => {
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (mutation.isSuccess) {
    const data = mutation.data;
    const isWaitingList = data.isWaitingList;

    return (
      <Card className={isWaitingList ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isWaitingList ? (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            )}
            <div>
              <CardTitle className={isWaitingList ? "text-yellow-900" : "text-green-900"}>
                {isWaitingList ? "נרשמת לרשימת המתנה" : "אישור השתתפות התקבל!"}
              </CardTitle>
              <CardDescription className={isWaitingList ? "text-yellow-700" : "text-green-700"}>
                מיקום בתור: #{data.queuePosition}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className={isWaitingList ? "bg-white border-yellow-300" : "bg-white border-green-300"}>
            <AlertDescription className="text-right">
              <div className="space-y-3">
                <div>
                  <strong>פרטי הרישום:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• סוג דירה שנבחר: {formData.apartmentType} חדרים</li>
                    <li>• מיקום בתור: #{data.queuePosition}</li>
                    {isWaitingList && (
                      <li className="text-yellow-700 font-medium">
                        • סטטוס: רשימת המתנה - נעדכן אותך אם מתפנה מקום
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="pt-2 border-t">
                  <strong>מה הלאה?</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• היזם ייצור איתך קשר בקרוב</li>
                    <li>• תתואם פגישה לבחירת דירה ספציפית</li>
                    <li>• תקבל את כל הפרטים הרלוונטיים</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>אישור השתתפות - {projectTitle}</CardTitle>
        <CardDescription>
          אשר את השתתפותך ובחר את סוג הדירה המועדף עליך
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutation.error?.message || "שגיאה באישור השתתפות. אנא נסה שוב."}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-right text-sm">
              ⏰ המקומות מוגבלים ומתמלאים לפי סדר הגעה (FIFO).
              <br />
              <strong>הזדרז לאשר את מקומך!</strong>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="לדוגמה: יוסי"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="לדוגמה: כהן"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="050-1234567"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apartmentType">סוג דירה מועדף *</Label>
            <Select
              value={formData.apartmentType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, apartmentType: value }))}
              required
            >
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="בחר סוג דירה" />
              </SelectTrigger>
              <SelectContent>
                {apartmentTypes.map((apt) => (
                  <SelectItem key={apt.type} value={apt.type} dir="rtl">
                    {apt.type} חדרים - החל מ-₪{apt.startingFromPrice.toLocaleString()}
                    {apt.count > 0 && ` (${apt.count} יח' זמינות)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              מחיר "החל מ" הוא מחיר אינדיקטיבי. המחיר הסופי ייקבע לפי הדירה הספציפית שתיבחר.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={mutation.isPending || !formData.apartmentType}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              "אישור השתתפות"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            בלחיצה על "אישור השתתפות" אתה מסכים להעברת פרטיך ליזם לצורך תיאום פגישה
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
