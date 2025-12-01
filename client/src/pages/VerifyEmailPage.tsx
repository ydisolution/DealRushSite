import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");

    if (!token || !userId) {
      setStatus("error");
      setMessage("קישור לא תקין");
      return;
    }

    verifyEmail({ token, userId })
      .then(() => {
        setStatus("success");
        setMessage("המייל אומת בהצלחה!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.message || "אירעה שגיאה באימות המייל");
      });
  }, [verifyEmail]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                מאמת את המייל...
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                אימות הצליח!
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                אימות נכשל
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {status !== "loading" && (
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              חזרה לדף הבית
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
