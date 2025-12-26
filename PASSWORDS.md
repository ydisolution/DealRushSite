# 🔐 פרטי התחברות - DealRush

## 👤 משתמשים במערכת

### 👨‍💼 Admin
- **Email:** admin@dealrush.co.il
- **Password:** Admin2024!
- **תפקיד:** מנהל מערכת
- **הרשאות:** גישה לכל המערכת, ניהול דילים, ניהול משתמשים

---

### 🏪 Supplier 1 (Dreamer)
- **Email:** dreamer@dealrush.co.il
- **Password:** Dreamer2024!
- **תפקיד:** ספק
- **חברה:** Dreamer Supplies
- **הרשאות:** יצירת דילים, ניהול דילים, אנליטיקס

---

### 🏪 Supplier 2 (Gmail)
- **Email:** Dreamer@gmail.com
- **Password:** Aa123456!
- **תפקיד:** ספק
- **חברה:** Dreamer Gmail Store
- **הרשאות:** יצירת דילים, ניהול דילים, אנליטיקס

---

### 🛍️ Customer 1 (ניר)
- **Email:** nir@example.com
- **Password:** Aa123456!
- **תפקיד:** לקוח
- **טלפון:** 050-1234567
- **הרשאות:** הצטרפות לדילים, צפייה בהיסטוריה

---

### 🛍️ Customer 2 (שלומי)
- **Email:** shlomi@example.com
- **Password:** Aa123456!
- **תפקיד:** לקוח
- **טלפון:** 052-9876543
- **הרשאות:** הצטרפות לדילים, צפייה בהיסטוריה

---

## 🚀 בדיקת התחברות

### Admin Panel
```
URL: http://localhost:5000/
Email: admin@dealrush.co.il
Password: Admin2024!
```

### Supplier Dashboard
```
URL: http://localhost:5000/
Email: dreamer@dealrush.co.il
Password: Dreamer2024!
```

### Customer
```
URL: http://localhost:5000/
Email: nir@example.com
Password: Aa123456!
```

---

## ⚠️ אבטחה

- ⚠️ **קובץ זה לא בגיט** (רשום ב-.gitignore)
- 🔒 **אל תשתף את הסיסמאות**
- 🔐 **שנה סיסמאות בפרודקשן**
- 📧 **אל תשתמש באימיילים אמיתיים בפיתוח**

---

## 🔄 איפוס סיסמאות

אם תרצה לאפס את כל הסיסמאות:

```bash
npm run db:seed
```

זה ימחק את כל הנתונים ויצור מחדש את כל המשתמשים עם הסיסמאות המקוריות.

---

## 📝 הערות

1. **isEmailVerified:** כל המשתמשים מאושרים אוטומטית (למטרות פיתוח)
2. **Rate Limiting:** 5 נסיונות התחברות ב-15 דקות
3. **Session:** נשמר ב-Memory (MemoryStore) - יאבד באתחול שרת

---

**תאריך יצירה:** 9 בדצמבר 2025  
**סביבה:** Development  
**סטטוס:** ✅ פעיל
