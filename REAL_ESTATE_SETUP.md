# DealRush Real Estate Module - Setup Instructions

## שלבים להשלמת ההטמעה:

### 1. עדכון בסיס הנתונים
```bash
# הרץ את drizzle push לעדכון הסכימה
npm run db:push
```

### 2. Seeding של בסיס הידע לעוזר הוירטואלי
```bash
npx tsx script/seedAiFaqKnowledge.ts
```

### 3. עדכון פרויקטי הנדל"ן עם תאריכי שלבים
```bash
npx tsx script/seedRealEstate10Projects.ts
```

### 4. הוספת משתנה סביבה ל-AI
הוסף ל`.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

### 5. הרץ את השרת
```bash
npm run dev
```

## מה כבר קיים:

✅ Backend:
- `/server/aiAssistant.ts` - שירות העוזר הוירטואלי
- `/server/realEstateRoutes.ts` - כל ה-API endpoints החדשים
- `migrations/0002_real_estate_funnel.sql` - מיגרציה לטבלאות
- `script/seedAiFaqKnowledge.ts` - 20+ שאלות ותשובות

✅ Frontend Components:
- `GuidedHelpBar.tsx` - פס עזרה מודרך
- `AIAssistantModal.tsx` - צ'אט עם העוזר
- `MicroHelp.tsx` - עזרה בטולטיפים
- `EarlyRegistrationForm.tsx` - רישום מוקדם
- `EventRSVPForm.tsx` - אישור הגעה
- `FinalRegistrationForm.tsx` - רישום סופי
- `StageStepper.tsx` - מחוון שלבים
- `RealEstateMap.tsx` - מפה עם פרויקטים

✅ Schema Updates:
- טבלת `project_events`
- טבלת `ai_conversations`
- טבלת `ai_faq_knowledge`
- עדכון `real_estate_projects` עם תאריכי שלבים
- עדכון `project_registrations` עם סטטוסי משפך מלאים

## נקודות חשובות:

1. **העוזר הוירטואלי** דורש Claude API key (Anthropic)
2. **המיגרציה** תוסיף עמודות לטבלאות קיימות ותיצור 3 טבלאות חדשות
3. **הקומפוננטות** מוכנות לשימוש - צריך לשלב אותן בעמודים הקיימים
4. **הסינון והמפה** מוכנים - צריך להוסיף toggle בין grid למפה

## שילוב בעמודים קיימים:

### בעמוד הפרויקט (ProjectDetailPage.tsx):
```tsx
import GuidedHelpBar from "@/components/GuidedHelpBar";
import StageStepper from "@/components/StageStepper";
// ... בתוך הקומפוננטה:
<GuidedHelpBar projectId={project.id} stageInfo={stageData} userStatus={myStatus} />
<StageStepper currentStage={project.currentStage} userStatus={myStatus} />
```

### בעמוד הרשימה (RealEstatePage.tsx):
```tsx
import RealEstateMap from "@/components/RealEstateMap";
// הוסף toggle בין grid למפה
{viewMode === "map" ? <RealEstateMap projects={projects} /> : <DealsGrid ... />}
```

## Endpoints חדשים זמינים:

- `POST /api/real-estate/projects/:id/early-registration`
- `POST /api/real-estate/projects/:id/event-rsvp`
- `POST /api/real-estate/projects/:id/final-registration`
- `GET /api/real-estate/projects/:id/my-status`
- `GET /api/real-estate/projects/:id/stage`
- `POST /api/ai/assistant`
- `GET /api/ai/quick-help/:topic`

## מה עוד נשאר לעשות:

1. **Admin Interface** - ממשק ניהול פרויקטים עם הגדרת תאריכי שלבים
2. **Email Templates** - תבניות מייל לכל שלב
3. **SMS Notifications** - שליחת SMS קריטיים
4. **Testing** - בדיקות end-to-end

הכל מוכן לעבודה! רק צריך להריץ את הפקודות למעלה.
