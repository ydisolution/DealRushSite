import { Link } from "wouter";
import { Zap } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: "אודות", href: "/about" },
      { label: "קריירה", href: "/careers" },
      { label: "צור קשר", href: "/contact" },
    ],
    support: [
      { label: "מרכז עזרה", href: "/help" },
      { label: "שאלות נפוצות", href: "/faq" },
      { label: "מדיניות החזרות", href: "/returns" },
    ],
    legal: [
      { label: "תנאי שימוש", href: "/terms" },
      { label: "מדיניות פרטיות", href: "/privacy" },
      { label: "נגישות", href: "/accessibility" },
    ],
  };

  return (
    <footer className="bg-muted/30 border-t" data-testid="footer">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">DealRush</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              פלטפורמת קניות קבוצתיות חכמה. ביחד חוסכים יותר.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">החברה</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-link-${link.label}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">תמיכה</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-link-${link.label}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">משפטי</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-link-${link.label}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} DealRush. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
}
