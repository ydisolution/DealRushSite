# 🔐 מדריך לסיבוב מפתחות (Key Rotation)

## 1️⃣ DATABASE_URL (Neon PostgreSQL)

**איפה:** https://console.neon.tech/
1. התחבר לחשבון
2. בחר את הפרויקט שלך
3. לחץ על **Settings** → **Reset Password**
4. העתק את ה-Connection String החדש
5. הדבק במקום `DATABASE_URL=`

---

## 2️⃣ SESSION_SECRET

**איפה:** יצירה מקומית
הרץ בטרמינל PowerShell:
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```
העתק את התוצאה והדבק במקום `SESSION_SECRET=`

---

## 3️⃣ STRIPE_WEBHOOK_SECRET

**איפה:** https://dashboard.stripe.com/
1. התחבר
2. **Developers** → **Webhooks**
3. בחר את ה-webhook הקיים או צור חדש
4. לחץ **Reveal** על Signing Secret
5. העתק והדבק במקום `STRIPE_WEBHOOK_SECRET=`

---

## 4️⃣ Gmail OAuth2 (3 מפתחות)

**איפה:** https://console.cloud.google.com/
1. בחר פרויקט → **APIs & Services** → **Credentials**
2. מצא את OAuth 2.0 Client ID הקיים
3. אופציה א': **Reset Secret** (מחדש את הסוד)
4. אופציה ב': צור חדש לגמרי (**Create Credentials** → **OAuth 2.0 Client ID**)

**חשוב:** אחרי שינוי, צריך לחדש גם את ה-**REFRESH_TOKEN**:
```
הרץ: npm run refresh-gmail-token
```
(אם אין סקריפט כזה, תצטרך להריץ OAuth flow מחדש)

- `GMAIL_CLIENT_ID=` 
- `GMAIL_CLIENT_SECRET=`
- `GMAIL_REFRESH_TOKEN=`

---

## 5️⃣ Twilio (WhatsApp)

**איפה:** https://console.twilio.com/
1. **Account** → **API keys & tokens**
2. לחץ **Reset Auth Token**
3. אשר והעתק את הטוקן החדש
4. הדבק במקום `TWILIO_AUTH_TOKEN=`

**שים לב:** ה-`TWILIO_ACCOUNT_SID` לא משתנה, רק ה-AUTH_TOKEN

---

## 6️⃣ OpenAI API Key

**איפה:** https://platform.openai.com/api-keys
1. התחבר לחשבון
2. לחץ **+ Create new secret key**
3. תן לו שם (למשל: "DealRush Production 2025")
4. **העתק מיד!** (לא תוכל לראות אותו שוב)
5. הדבק במקום `OPENAI_API_KEY=`
6. חזור לרשימה → **מחק את המפתח הישן**

---

## 📝 אחרי שסיימת:

1. **אל תשתף את הקובץ .env עם אף אחד** (כולל AI/Chat)
2. בדוק ש-.env נמצא ב-.gitignore:
   ```
   .env
   .env.*
   ```
3. הפעל מחדש את השרת:
   ```
   npm run dev
   ```
4. בדוק שהכל עובד

---

## ⚠️ לזכור:
- **Database** - אם תשנה סיסמה, כל הסביבות צריכות להתעדכן
- **Gmail Refresh Token** - נוצר פעם אחת, אם תמחק צריך OAuth flow מחדש
- **OpenAI** - מחק מפתח ישן רק אחרי שהחדש עובד

---

**תאריך סיבוב אחרון:** ___________
**הסיבה:** חשיפה לסביבת AI / שגרת אבטחה
