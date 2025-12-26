# 📋 מערכת ניהול הזמנות - Kanban Board

## 🎯 סקירה כללית

מערכת ניהול הזמנות מתקדמת בסגנון **Kanban Board** (דומה ל-Trello/Monday) שמאפשרת לספקים לנהל את תהליך הטיפול בהזמנות בצורה חזותית ואינטואיטיבית.

## ✨ תכונות עיקריות

### 1. **תצוגת לוח Kanban**
- 6 שלבים (Stages) בתהליך ההזמנה
- גרירה והזחה (Drag & Drop) של כרטיסים בין שלבים
- עדכון סטטוס אוטומטי בעת הזזת כרטיס
- אנימציות חלקות ו-Optimistic UI

### 2. **כרטיסי הזמנה (Order Cards)**
כל כרטיס מכיל:
- מזהה הזמנה (#ID)
- שם לקוח
- שם מוצר/דיל
- כמות
- תאריך יצירה
- Badge עדיפות (low/normal/high/urgent)
- אייקונים לסטטוס:
  - ⚠️ באיחור
  - ⚡ דחוף (עד 2 ימים)
  - 💬 טעון תיאום
  - 🚚 יש מספר מעקב
  - 🚩 עדיפות גבוהה

### 3. **6 שלבים בתהליך**

| שלב | כותרת | צבע | תיאור |
|-----|--------|-----|--------|
| `pending` | הזמנה חדשה | כחול | הזמנה שנסגרה בדיל |
| `verified` | תשלום אומת | ירוק | תשלום אושר |
| `needs_coordination` | טעון תיאום | כתום | דורש תיאום עם הלקוח |
| `scheduled` | מתוזמן למשלוח | סגול | תוזמן למשלוח |
| `out_for_delivery` | במשלוח | תכלת | יצא למשלוח |
| `delivered` | נמסר ללקוח | ירוק בהיר | נמסר בהצלחה |

### 4. **חיפוש וסינון**
- חיפוש לפי: שם לקוח, אימייל, טלפון, מוצר, מזהה הזמנה
- סינון דינמי תוך כדי הקלדה
- Badge עם מספר ההזמנות הנוכחיות

### 5. **פתיחת כרטיס לעריכה**
- Click על כרטיס פותח את **OrderDetailsDrawer**
- ניהול מלא של כל פרטי ההזמנה:
  - פרטי לקוח
  - מידע משלוח
  - הערות ספק/הערות פנימיות
  - מספר מעקב
  - חברת שילוח
  - תאריך אספקה צפוי
  - עדיפות
  - היסטוריית סטטוסים

### 6. **Validation חכם**
- חסימת מעבר ל-"במשלוח" ללא מספר מעקב
- הודעות שגיאה ברורות
- הצעה לפתוח כרטיס להשלמת נתונים

### 7. **מעבר בין תצוגות**
- כפתור "תצוגת טבלה" בראש הלוח → חזרה לטבלה מלאה
- כפתור "תצוגת לוח" בראש הטבלה → מעבר ללוח Kanban
- שמירת מצב ונתונים בין התצוגות

## 📁 מבנה הקוד

### קבצים חדשים שנוצרו:

```
client/src/
├── pages/
│   └── OrdersBoard.tsx          # מסך ראשי של הלוח
└── components/
    ├── KanbanStage.tsx          # קומפוננטת עמודה בלוח
    └── OrderCard.tsx            # קומפוננטת כרטיס הזמנה
```

### קבצים שעודכנו:

```
client/src/
├── App.tsx                      # נוסף Route חדש
└── pages/
    └── SupplierOrders.tsx       # נוסף כפתור "תצוגת לוח"
```

## 🔧 טכנולוגיות

### ספריות Drag & Drop
- **@dnd-kit/core** - ליבה של מערכת הגרירה
- **@dnd-kit/sortable** - מיון אלמנטים בגרירה
- **@dnd-kit/utilities** - כלי עזר

### מאפיינים טכניים
- **Optimistic UI** - עדכון מיידי לפני תגובת שרת
- **Rollback** - ביטול שינוי במקרה של שגיאה
- **PointerSensor** - תמיכה במסך מגע + עכבר
- **Collision Detection** - זיהוי אוטומטי של אזורי Drop
- **DragOverlay** - תצוגה מרחפת בזמן גרירה

## 🎨 עיצוב UI/UX

### עקרונות עיצוב:
1. **Visual Feedback** - מסגרת סגולה כאשר עמודה היא Drop zone
2. **Hover Effects** - Shadow על כרטיס בעת מעבר עכבר
3. **Color Coding** - פס צבעוני בצד ימין של כרטיס:
   - אדום = באיחור
   - כתום = דחוף
   - אפור = רגיל
4. **Badges** - צבעים סמנטיים לעדיפות
5. **Icons** - אייקונים אינטואיטיביים לסטטוס מהיר

### Responsive Design:
- Desktop First - מותאם ל-7 עמודות רחבות
- Horizontal Scroll - גלילה אופקית במסכים קטנים
- Fixed Width Cards - 320px לכל כרטיס

## 🚀 שימוש

### ניווט ללוח:
```
/supplier/orders/board
```

### מעבר מטבלה ללוח:
1. היכנס למסך "מערכת ניהול הזמנות CRM" (`/supplier/orders`)
2. לחץ על כפתור **"תצוגת לוח"** בפינה ימין עליונה
3. הלוח ייפתח עם כל ההזמנות מסודרות לפי סטטוס

### עבודה עם הלוח:

#### גרירת כרטיס:
1. לחץ והחזק על כרטיס
2. גרור לעמודה אחרת
3. שחרר - הסטטוס יתעדכן אוטומטית

#### פתיחת כרטיס:
1. לחץ על כרטיס (ללא גרירה)
2. Drawer יפתח מימין
3. ערוך את כל הפרטים
4. שינויים נשמרים אוטומטית

#### חיפוש הזמנה:
1. הקלד בשדה החיפוש למעלה
2. תוצאות מסוננות בזמן אמת
3. Counter מראה כמה הזמנות מתאימות

## 🔗 API Endpoints

### עדכון סטטוס:
```typescript
PATCH /api/suppliers/orders/:orderId/status
Body: { status: "out_for_delivery" }
```

### קבלת כל ההזמנות:
```typescript
GET /api/suppliers/orders
```

## ⚙️ Workflow Logic

### תרשים זרימה:

```
pending → verified → needs_coordination → scheduled → out_for_delivery → delivered
            ↓              ↓                  ↓              ↓
         (skip)         (skip)            (skip)         (delivery)
```

### Validation Rules:

1. **מעבר ל-out_for_delivery**:
   - חייב מספר מעקב (trackingNumber)
   - אחרת: הודעת שגיאה + חסימה

2. **מעבר ל-delivered**:
   - חייב להיות במצב out_for_delivery קודם
   - מעדכן deliveredDate אוטומטית

3. **Rollback**:
   - שגיאה מהשרת → ביטול שינוי ויזואלי
   - הודעת Toast עם הסיבה

## 📊 State Management

### Local State (OrdersBoard.tsx):
```typescript
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
const [detailsOpen, setDetailsOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [activeId, setActiveId] = useState<string | null>(null);
```

### Server State (React Query):
```typescript
const { data: orders = [], isLoading } = useQuery<Order[]>({
  queryKey: ["/api/suppliers/orders"],
});
```

### Mutations:
```typescript
const updateStatusMutation = useMutation({
  mutationFn: async ({ orderId, status }) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers/orders"] });
    toast({ title: "✅ סטטוס עודכן בהצלחה" });
  },
  onError: (error) => {
    toast({ title: "❌ שגיאה", description: error.message });
    queryClient.invalidateQueries(); // Rollback
  },
});
```

## 🧪 Testing Scenarios

### 1. Happy Flow:
- גרור כרטיס מ-pending → verified → scheduled → out_for_delivery → delivered
- בדוק שכל מעבר מעדכן את ה-DB

### 2. Validation:
- נסה לגרור ל-out_for_delivery ללא tracking number
- בדוק שמופיעה הודעת שגיאה

### 3. Edge Cases:
- 100+ הזמנות - בדוק performance
- גרירה מהירה - בדוק שלא נוצרים race conditions
- אובדן חיבור - בדוק Rollback

### 4. UX:
- בדוק שהאנימציות חלקות
- בדוק שה-Overlay מוצג נכון בזמן גרירה
- בדוק שהחיפוש עובד בזמן אמת

## 🐛 Known Issues & Future Improvements

### Known Issues:
- אין pagination בלוח (רק בטבלה)
- אין סינון לפי עדיפות בלוח
- אין drag בין עמודות לא סמוכות (רק לעמודה הבאה/קודמת)

### Future Improvements:
1. **Virtual Scrolling** - ל-1000+ הזמנות
2. **Swimlanes** - חלוקה לפי עדיפות/ספק
3. **Batch Operations** - בחירת כרטיסים מרובים וגרירה קבוצתית
4. **Keyboard Navigation** - תמיכה במקלדת
5. **Filters Bar** - סינון לפי תאריך/עדיפות/חברת משלוח
6. **Custom Stages** - אפשרות להוסיף שלבים מותאמים
7. **Analytics** - סטטיסטיקות על זמני מעבר בין שלבים
8. **Mobile Support** - אופטימיזציה למובייל (swipe gestures)

## 📝 Notes

- הלוח משתמש באותו API כמו הטבלה - אין צורך בשינויים בצד Server
- כל ההזמנות טעונות לזיכרון - אין lazy loading
- ה-Drawer המשותף (OrderDetailsDrawer) עובד גם מהטבלה וגם מהלוח
- ה-Search מסנן רק את הכרטיסים הנראים, לא משפיע על הספירה בעמודות

## 🎉 סיכום

המערכת מספקת חווית משתמש מתקדמת לניהול הזמנות עם:
- ✅ Drag & Drop חלק ומהיר
- ✅ Validation חכם
- ✅ Optimistic UI
- ✅ חיפוש בזמן אמת
- ✅ עיצוב נקי ואינטואיטיבי
- ✅ מעבר חלק בין תצוגות
- ✅ תמיכה בכל תכונות ה-CRM הקיימות

**הלוח מוכן לשימוש מיידי!** 🚀
