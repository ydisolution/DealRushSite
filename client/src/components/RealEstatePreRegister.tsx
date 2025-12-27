import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";

interface PreRegisterFormProps {
  projectSlug: string;
  projectTitle?: string;
  onSuccess?: () => void;
  totalCapacity?: number;
  currentRegistrantCount?: number;
}

export default function RealEstatePreRegister({ projectSlug, projectTitle = "", onSuccess, totalCapacity, currentRegistrantCount }: PreRegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/real-estate/projects/${projectSlug}/pre-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "שגיאה בהרשמה");
      }

      return res.json();
    },
    onSuccess: () => {
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
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle className="text-green-900">נרשמת בהצלחה!</CardTitle>
              <CardDescription className="text-green-700">
                נעדכן אותך בקרוב לגבי מועד המצגת
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-white border-green-300">
            <AlertDescription className="text-right">
              <strong>מה הלאה?</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• תקבל הזמנה למצגת הפרויקט במייל וב-WhatsApp</li>
                <li>• במצגת תכיר את הפרויקט לעומק</li>
                <li>• לאחר המצגת יפתח חלון אישור השתתפות</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הרשמה מוקדמת - {projectTitle}</CardTitle>
        <CardDescription>
          הצטרף לקבוצת הרכישה וקבל הזמנה לכנס רוכשים
        </CardDescription>
        {totalCapacity && currentRegistrantCount !== undefined && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-semibold text-purple-900 text-center">
              📊 {currentRegistrantCount} נרשמים מתוך {totalCapacity} מקומות זמינים
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutation.error?.message || "שגיאה בהרשמה. אנא נסה שוב."}
              </AlertDescription>
            </Alert>
          )}

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

          <Button 
            type="submit" 
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              "הרשמה לקבוצת הרכישה"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            בהרשמה אתה מאשר קבלת עדכונים על הפרויקט
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
