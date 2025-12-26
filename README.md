# 🚀 DealRush - פלטפורמת קניות קבוצתיות

פלטפורמה חכמה לקניות קבוצתיות עם הנחות מיוחדות במגוון קטגוריות: אלקטרוניקה, ריהוט, נדל"ן ועוד.

## 📋 תכונות עיקריות

- 🛍️ **דילים בקטגוריות מגוונות**: אלקטרוניקה, ריהוט, נדל"ן, מוצרי בית ועוד
- 👥 **קניות קבוצתיות**: הצטרפות לדילים קיימים או יצירת דילים חדשים
- 💳 **תשלומים מאובטחים**: אינטגרציה עם Stripe
- 🤖 **עוזרת AI חכמה**: נוגה - עוזרת וירטואלית עם OpenAI
- 📧 **התראות**: Email (Gmail) ו-WhatsApp (Twilio)
- 📊 **דשבורד ניהול**: ממשק מתקדם לניהול דילים ומשתמשים
- 🏢 **מודול נדל"ן**: מערכת רכישה קבוצתית של דירות מקבלן
- 🔐 **אימות מאובטח**: OAuth2 (Google, Facebook) + Local Auth

## 🛠️ טכנולוגיות

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Wouter (routing)
- Framer Motion (animations)

### Backend
- Node.js + Express
- PostgreSQL (Neon Database)
- Drizzle ORM
- Passport.js (authentication)
- Redis/Memory Store (sessions)

### External Services
- **Stripe**: תשלומים מאובטחים
- **OpenAI**: עוזרת AI (GPT-4)
- **Twilio**: הודעות WhatsApp
- **Gmail API**: שליחת מיילים
- **Neon**: PostgreSQL database בענן

## 🚀 התקנה והרצה

### דרישות מקדימות
- Node.js 18+
- npm או yarn
- PostgreSQL (או חשבון Neon)

### התקנה

```bash
# שכפול הפרויקט
git clone <repository-url>
cd DealRushSite

# התקנת תלויות
npm install

# הגדרת משתני סביבה
cp .env.template .env
# ערוך את .env עם המפתחות שלך

# יצירת הטבלאות במסד הנתונים
npm run db:push

# הרצה במצב פיתוח
npm run dev
```

האתר יהיה זמין ב: http://localhost:5000

### סקריפטים נוספים

```bash
# בניה לייצור
npm run build

# הרצה בייצור
npm start

# בדיקת TypeScript
npm run check

# גיבוי מקומי
npm run backup

# הוספת דילי נדל"ן
npx tsx script/addRealEstateDeals.ts

# ארגון מוצרים
npx tsx script/organizeProducts.ts
```

## 📁 מבנה הפרויקט

```
DealRushSite/
├── client/              # Frontend (React)
│   ├── src/
│   │   ├── components/  # קומפוננטות UI
│   │   ├── pages/       # דפי האתר
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/              # Backend (Express)
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication
│   ├── aiAssistant.ts   # AI service
│   ├── realEstateRoutes.ts  # Real estate module
│   └── stripeService.ts # Payment processing
├── shared/              # Shared types & schemas
│   └── schema.ts        # Database schema (Drizzle)
├── script/              # Utility scripts
│   ├── seedRealEstate.ts
│   ├── addRealEstateDeals.ts
│   ├── organizeProducts.ts
│   └── fixProducts.ts
├── migrations/          # Database migrations
└── public/              # Static files
```

## 🔐 אבטחה

- ✅ כל המפתחות ב-`.env` - **לא מועלים ל-Git**
- ✅ Session secrets מוצפנים
- ✅ Rate limiting על API endpoints
- ✅ CORS מוגדר כראוי
- ✅ SQL injection protected (Drizzle ORM)
- ✅ Password hashing (bcrypt)

## 🏢 מודול נדל"ן

המערכת כוללת מודול מיוחד לרכישה קבוצתית של דירות:
- 📋 רישום מוקדם עם countdown timer
- 🎯 שלבי רכישה מתקדמים
- 🤖 עוזרת AI מותאמת אישית (נוגה)
- 📊 דשבורד למעקב אחר פרויקטים
- 📧 התראות אוטומטיות בכל שלב

## 📦 גיבוי

### גיבוי מקומי
```bash
npm run backup
```

הגיבויים נשמרים ב-`../Backups/` עם timestamp.

### גיבוי ב-GitHub
הפרויקט מגובה אוטומטית ב-GitHub בכל commit.

## 👥 משתמשים לדוגמה

### Admin
- Email: `admin@dealrush.co.il`
- Password: `Admin123!`

### Supplier
- Email: `dreamer@dealrush.co.il`
- Password: `Aa123456!`

## 🎨 עיצוב

הפרויקט משתמש בעיצוב RTL (מימין לשמאל) המותאם לעברית:
- ערכת צבעים: סגול (#7B2FF7) כצבע ראשי
- Responsive design למובייל וטאבלט
- אנימציות חלקות עם Framer Motion
- UI components מ-shadcn/ui

## 🚀 Deployment

הפרויקט מוכן ל-deployment על:
- Vercel
- Railway
- Render
- Replit

יש להגדיר את משתני הסביבה בפלטפורמת ההעלאה.

## 📝 רישיון

MIT License

## 👨‍💻 תמיכה

לשאלות ובעיות: פתח issue ב-GitHub

---

**⚠️ הערה חשובה**: אל תשכח לעדכן את `.env` עם המפתחות האמיתיים שלך!

**עדכון אחרון**: דצמבר 2025
