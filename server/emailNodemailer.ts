import nodemailer from 'nodemailer';

// Gmail configuration with OAuth2
const GMAIL_USER = 'office.dealrush@gmail.com';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

// Check if email configuration is complete
const isEmailConfigured = !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);

if (!isEmailConfigured) {
  console.warn('⚠️  [EMAIL] Gmail OAuth2 credentials not configured!');
  console.warn('   GMAIL_CLIENT_ID:', GMAIL_CLIENT_ID ? 'SET' : 'MISSING');
  console.warn('   GMAIL_CLIENT_SECRET:', GMAIL_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.warn('   GMAIL_REFRESH_TOKEN:', GMAIL_REFRESH_TOKEN ? 'SET' : 'MISSING');
  console.warn('   Emails will NOT be sent until credentials are configured in .env');
} else {
  console.log('✅ [EMAIL] Gmail OAuth2 credentials configured');
}

// Create transporter with OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: GMAIL_USER,
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    refreshToken: GMAIL_REFRESH_TOKEN,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Check if email is configured before attempting to send
  if (!isEmailConfigured) {
    console.error(`[EMAIL][SKIP] Cannot send email to ${options.to} - Gmail credentials not configured`);
    console.error(`[EMAIL][SKIP] Subject: "${options.subject}"`);
    console.error(`[EMAIL][SKIP] Please configure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in .env file`);
    return false;
  }

  try {
    console.log(`[EMAIL][SEND] Attempting to send email to ${options.to}, subject: "${options.subject}"`);
    const mailOptions = {
      from: `DealRush <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.htmlBody,
      text: options.textBody || options.htmlBody.replace(/<[^>]*>/g, ''),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL][SUCCESS] Email sent successfully to ${options.to}, messageId: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL][ERROR] Failed to send email to ${options.to}:`, error);
    if (error instanceof Error) {
      console.error(`[EMAIL][ERROR] Error message: ${error.message}`);
      console.error(`[EMAIL][ERROR] Error stack:`, error.stack);
    }
    return false;
  }
}

export async function sendWelcomeEmail(
  toEmail: string,
  firstName: string,
  verificationToken?: string,
  userId?: string
): Promise<boolean> {
  const APP_URL = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'http://localhost:5000';
  
  const verificationUrl = verificationToken && userId
    ? `${APP_URL}/verify-email?token=${verificationToken}&userId=${userId}`
    : null;
  
  const subject = "ברוכים הבאים ל-DealRush! 🎉";
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 32px; }
        .content { padding: 40px 30px; background: #f8f9fa; }
        .welcome-text { font-size: 18px; line-height: 1.8; color: #333; }
        .verify-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; }
        .verify-button:hover { opacity: 0.9; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #667eea; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .link-text { word-break: break-all; color: #667eea; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ברוכים הבאים ל-DealRush!</h1>
        </div>
        <div class="content">
          <p class="welcome-text">שלום ${firstName},</p>
          <p class="welcome-text">תודה רבה על ההצטרפות לקהילת DealRush - הפלטפורמה המובילה לקניות קבוצתיות חכמות!</p>
          
          ${verificationUrl ? `
          <div class="info-box">
            <p><strong>כדי להשלים את ההרשמה, אנא אמת את כתובת המייל שלך:</strong></p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="verify-button">אמת את המייל שלי</a>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">או העתק את הקישור הבא:</p>
            <p class="link-text">${verificationUrl}</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">⏰ הקישור תקף ל-24 שעות</p>
          </div>
          ` : ''}
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #667eea;">💡 איך זה עובד?</h3>
            <p>כל דיל מתחיל במחיר גבוה ויורד ככל שיותר אנשים מצטרפים</p>
            <p>ככל שיותר אנשים קונים - המחיר יורד לכולם!</p>
            <p>זה win-win - חיסכון אמיתי דרך כוח הקנייה הקבוצתית</p>
          </div>
          
          <p class="welcome-text">מוכנים להתחיל לחסוך? גלו את הדילים המדהימים שלנו!</p>
        </div>
        <div class="footer">
          <p>תודה שבחרת ב-DealRush</p>
          <p>קניות קבוצתיות חכמות 🛍️</p>
          <p style="margin-top: 15px; font-size: 11px; color: #999;">אם לא נרשמת ל-DealRush, אנא התעלם מהודעה זו.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendDealJoinNotification(
  toEmail: string,
  dealName: string,
  totalPrice: number,
  position: number,
  quantity: number = 1,
  currentPrice?: number,
  shippingInfo?: {
    address: string;
    city: string;
    zipCode: string;
    cost: number;
  }
): Promise<boolean> {
  const subject = quantity > 1 
    ? `✅ הצטרפת בהצלחה לדיל: ${dealName} (${quantity} יחידות)`
    : `✅ הצטרפת בהצלחה לדיל: ${dealName}`;
  
  const quantityInfo = quantity > 1 
    ? `<p style="margin: 10px 0;"><strong>כמות:</strong> ${quantity} יחידות</p>`
    : '';
  
  const priceLabel = quantity > 1 ? 'סה"כ לתשלום' : 'המחיר הנוכחי שלך';
  
  const currentPriceInfo = currentPrice 
    ? `<p style="margin: 10px 0; color: #28a745;"><strong>מחיר נוכחי ליחידה:</strong> ₪${currentPrice.toLocaleString()}</p>`
    : '';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', 'Heebo', 'Rubik', Arial, sans-serif; 
          direction: rtl; 
          margin: 0; 
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0 0 10px 0; 
          font-size: 28px;
          font-weight: 700;
        }
        .header p { 
          margin: 0; 
          font-size: 18px;
          opacity: 0.95;
        }
        .content { 
          background: #ffffff; 
          padding: 30px; 
        }
        .content h2 {
          color: #333;
          margin: 0 0 20px 0;
          font-size: 22px;
          text-align: center;
          border-bottom: 2px solid #667eea;
          padding-bottom: 15px;
        }
        .price-box { 
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px; 
          border-radius: 10px; 
          margin: 20px 0; 
          text-align: center;
          border: 2px solid #667eea;
        }
        .price { 
          font-size: 42px; 
          color: #667eea; 
          font-weight: 700; 
          margin: 10px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .info-box { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 15px 0; 
          border-right: 4px solid #667eea;
        }
        .info-box p { 
          margin: 8px 0; 
          line-height: 1.6;
          color: #333;
        }
        .highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-right: 4px solid #ffc107;
          text-align: center;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background-color: #f8f9fa;
          color: #666; 
          font-size: 13px; 
        }
        .footer p { margin: 5px 0; }
        strong { color: #495057; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 DealRush 🎉</h1>
          <p>הצטרפת בהצלחה לדיל!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          
          <div class="price-box">
            <p style="margin: 0; font-size: 16px; color: #666;">${priceLabel}</p>
            <div class="price">₪${totalPrice.toLocaleString()}</div>
            ${currentPriceInfo}
            ${quantityInfo}
          </div>
          
          <div class="info-box">
            <p><strong>📍 מיקום בתור:</strong> #${position}${quantity > 1 ? ` - ${position + quantity - 1}` : ''}</p>
            <p><strong>💰 המחיר שלך:</strong> זהו המחיר המדויק שאתה משלם כרגע</p>
            <p><strong>💡 טיפ:</strong> המחיר עשוי לרדת עוד יותר אם יצטרפו משתתפים נוספים!</p>
            <p style="color: #28a745; font-size: 13px;">⚡ אם המחיר ירד, תשלם פחות בסופו של דבר</p>
          </div>
          
          ${shippingInfo ? `
          <div class="info-box" style="background: #e7f3ff; border-right-color: #0066cc;">
            <p style="margin: 0 0 10px 0; font-weight: 700; color: #0066cc;">📦 פרטי משלוח</p>
            <p><strong>כתובת:</strong> ${shippingInfo.address}</p>
            <p><strong>עיר:</strong> ${shippingInfo.city}</p>
            <p><strong>מיקוד:</strong> ${shippingInfo.zipCode}</p>
            <p><strong>עלות משלוח:</strong> ₪${(shippingInfo.cost / 100).toFixed(2)}</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">המוצר יישלח לכתובת זו לאחר סגירת הדיל</p>
          </div>
          ` : ''}
          
          <div class="highlight">
            <p style="margin: 0; font-weight: 600;">🔔 נעדכן אותך כשהמחיר ירד או כשהדיל ייסגר</p>
          </div>
          
          <p style="text-align: center; margin-top: 20px; color: #666;">
            תודה שבחרת ב-DealRush - קניות קבוצתיות חכמות 🛍️
          </p>
        </div>
        <div class="footer">
          <p><strong>DealRush</strong></p>
          <p>ביחד חוסכים יותר</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendPriceDropNotification(
  toEmail: string,
  dealName: string,
  oldPrice: number,
  newPrice: number
): Promise<boolean> {
  const savings = oldPrice - newPrice;
  const subject = `המחיר ירד! ${dealName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .price-old { font-size: 20px; color: #999; text-decoration: line-through; }
        .price-new { font-size: 36px; color: #22c55e; font-weight: bold; }
        .savings { background: #dcfce7; color: #16a34a; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DealRush</h1>
          <p>חדשות מעולות!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            <p class="price-old">₪${oldPrice.toLocaleString()}</p>
            <p class="price-new">₪${newPrice.toLocaleString()}</p>
            <p class="savings">חוסכים ₪${savings.toLocaleString()}!</p>
          </div>
          <p>המחיר ירד כי עוד אנשים הצטרפו לדיל. זכור - אתה תמיד משלם את המחיר הנמוך ביותר!</p>
        </div>
        <div class="footer">
          <p>תודה שבחרת ב-DealRush</p>
          <p>קניות קבוצתיות חכמות</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendDealClosedNotification(
  toEmail: string,
  dealName: string,
  finalPrice: number,
  originalPrice: number,
  position: number = 0,
  discountPercent: number = 0,
  quantity: number = 1
): Promise<boolean> {
  const savings = originalPrice - finalPrice;
  const calculatedDiscount = discountPercent || Math.round((savings / originalPrice) * 100);
  const subject = `🎉 מזל טוב! הדיל נסגר בהצלחה: ${dealName}`;
  
  const quantityInfo = quantity > 1 
    ? `<p style="text-align: right;"><strong>כמות:</strong> ${quantity} יחידות</p>`
    : '';
  
  const positionInfo = position > 0 
    ? `<p style="text-align: right;"><strong>המיקום שלך בדיל:</strong> #${position}</p>`
    : '';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: right; border-radius: 10px 10px 0 0; }
        .header h1 { text-align: center; margin: 0 0 10px 0; }
        .header p { text-align: center; margin: 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: right; }
        .content h2 { text-align: right; color: #333; }
        .content p { text-align: right; }
        .price { font-size: 36px; color: #22c55e; font-weight: bold; text-align: center; }
        .original-price { font-size: 18px; color: #999; text-decoration: line-through; text-align: center; }
        .savings { background: #dcfce7; color: #16a34a; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: right; }
        .celebration { font-size: 48px; text-align: center; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="celebration">🎉</div>
          <h1>DealRush</h1>
          <p>מזל טוב! הדיל נסגר בהצלחה!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            <p style="text-align: right;"><strong>המחיר הסופי שלך:</strong></p>
            <p class="original-price">₪${originalPrice.toLocaleString()}</p>
            <p class="price">₪${finalPrice.toLocaleString()}</p>
            <p style="text-align: center;"><span class="savings">חסכת ${calculatedDiscount}% - ₪${savings.toLocaleString()}!</span></p>
          </div>
          <div class="info-box">
            ${positionInfo}
            ${quantityInfo}
          </div>
          <p>נציג יצור איתך קשר בקרוב לסיום הרכישה ותיאום המשלוח.</p>
          <p>תודה שהשתתפת בקנייה הקבוצתית וחסכת כסף יחד עם שאר המשתתפים!</p>
        </div>
        <div class="footer">
          <p>תודה שבחרת ב-DealRush</p>
          <p>קניות קבוצתיות חכמות</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendDealCancelledNotification(
  toEmail: string,
  dealName: string,
  reason: string
): Promise<boolean> {
  const subject = `הדיל בוטל: ${dealName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: right; border-radius: 10px 10px 0 0; }
        .header h1 { text-align: center; margin: 0 0 10px 0; }
        .header p { text-align: center; margin: 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; text-align: right; }
        .content h2 { text-align: right; color: #333; }
        .content p { text-align: right; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: right; }
        .notice { background: #fef2f2; color: #dc2626; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: right; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DealRush</h1>
          <p>הדיל בוטל</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="notice">
            <p><strong>סיבת הביטול:</strong></p>
            <p>${reason}</p>
          </div>
          <div class="info-box">
            <p><strong>חדשות טובות!</strong></p>
            <p>לא חויבת בגין דיל זה. הכרטיס שלך לא נפגע.</p>
          </div>
          <p>אנחנו מזמינים אותך לבדוק דילים נוספים באתר!</p>
        </div>
        <div class="footer">
          <p>תודה שבחרת ב-DealRush</p>
          <p>קניות קבוצתיות חכמות</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendTierUnlockedNotification(
  toEmail: string,
  dealName: string,
  tierNumber: number,
  oldPrice: number,
  newPrice: number,
  discountPercent: number,
  totalUnits: number = 1,
  originalPrice?: number
): Promise<boolean> {
  const pricePerUnit = newPrice;
  const oldPricePerUnit = oldPrice;
  const totalNewPrice = newPrice * totalUnits;
  const totalOldPrice = oldPrice * totalUnits;
  const savings = totalOldPrice - totalNewPrice;
  const totalSavingsFromOriginal = originalPrice ? (originalPrice * totalUnits) - totalNewPrice : savings;
  
  const subject = `🎯 מחיר חדש! ${dealName} - חוסכים ₪${savings.toLocaleString()}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; text-align: right; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 28px; }
        .header .celebration { font-size: 60px; margin-bottom: 10px; animation: bounce 1s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .content { padding: 30px; }
        .deal-name { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; text-align: center; }
        .tier-badge { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 30px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 20px; margin: 20px 0; }
        .price-section { background: #fef3c7; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .price-label { font-size: 14px; color: #666; margin-bottom: 5px; }
        .price-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
        .price-old { font-size: 20px; color: #999; text-decoration: line-through; }
        .price-new { font-size: 32px; color: #d97706; font-weight: bold; }
        .price-arrow { font-size: 24px; color: #22c55e; margin: 0 10px; }
        .savings-badge { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 15px 25px; border-radius: 30px; font-weight: bold; font-size: 22px; margin: 20px 0; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #d97706; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #666; font-size: 15px; }
        .info-value { font-weight: bold; color: #1a1a1a; font-size: 16px; }
        .highlight { background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; font-size: 16px; }
        .cta-button { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 18px; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: scale(1.05); }
        .footer { text-align: center; padding: 30px; background: #f8f9fa; color: #666; font-size: 13px; }
        .footer-logo { font-weight: bold; color: #d97706; font-size: 16px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="celebration">🎯🎉</div>
          <h1>המחיר שלך ירד!</h1>
          <p style="font-size: 18px; margin: 10px 0 0 0;">שלב הנחה ${tierNumber} נפתח</p>
        </div>
        
        <div class="content">
          <div class="deal-name">${dealName}</div>
          
          <div style="text-align: center;">
            <span class="tier-badge">⭐ שלב ${tierNumber} - ${discountPercent}% הנחה</span>
          </div>
          
          <div class="price-section">
            <div class="price-label">מחיר ליחידה:</div>
            <div class="price-row">
              <div>
                <div class="price-label">מחיר קודם</div>
                <div class="price-old">₪${oldPricePerUnit.toLocaleString()}</div>
              </div>
              <div class="price-arrow">←</div>
              <div>
                <div class="price-label">מחיר חדש</div>
                <div class="price-new">₪${pricePerUnit.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">כמות יחידות שרכשת:</span>
              <span class="info-value">${totalUnits} יחידות</span>
            </div>
            ${originalPrice ? `
            <div class="info-row">
              <span class="info-label">מחיר פתיחה (ליחידה):</span>
              <span class="info-value">₪${originalPrice.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">מחיר התחלתי (סה"כ):</span>
              <span class="info-value">₪${(originalPrice * totalUnits).toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">מחיר קודם (סה"כ):</span>
              <span class="info-value">₪${totalOldPrice.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">מחיר עדכני (סה"כ):</span>
              <span class="info-value" style="color: #d97706; font-size: 20px;">₪${totalNewPrice.toLocaleString()}</span>
            </div>
            <div class="info-row" style="background: #fef3c7; margin-top: 10px; padding: 15px; border-radius: 8px;">
              <span class="info-label" style="font-size: 16px;">💰 חיסכון שלך:</span>
              <span class="info-value" style="color: #16a34a; font-size: 20px;">₪${savings.toLocaleString()}</span>
            </div>
            ${originalPrice && totalSavingsFromOriginal > savings ? `
            <div class="info-row" style="background: #dcfce7; margin-top: 10px; padding: 15px; border-radius: 8px;">
              <span class="info-label" style="font-size: 16px;">🎉 חיסכון כולל ממחיר הפתיחה:</span>
              <span class="info-value" style="color: #16a34a; font-size: 20px;">₪${totalSavingsFromOriginal.toLocaleString()} (${Math.round((totalSavingsFromOriginal / (originalPrice * totalUnits)) * 100)}%)</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <strong>🔥 ככל שיותר אנשים מצטרפים, המחיר ממשיך לרדת!</strong><br>
            שתף את הדיל עם חברים ומשפחה כדי לחסוך עוד יותר.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/deal/${dealName}" class="cta-button">
              צפה בדיל ושתף →
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-logo">⚡ DealRush</div>
          <p>קניות קבוצתיות חכמות - ביחד חוסכים יותר</p>
          <p style="margin-top: 15px; font-size: 12px;">
            המחיר הסופי ייקבע בסגירת הדיל<br>
            את/ה תחויב/י במחיר הנמוך ביותר שהושג
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export async function sendPaymentChargedNotification(
  toEmail: string,
  dealName: string,
  amount: number,
  cardLast4: string
): Promise<boolean> {
  const subject = `אישור תשלום: ${dealName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .checkmark { font-size: 48px; margin-bottom: 10px; }
        .amount { font-size: 36px; color: #22c55e; font-weight: bold; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .card-info { background: #f3f4f6; padding: 10px 15px; border-radius: 8px; display: inline-block; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">✓</div>
          <h1>DealRush</h1>
          <p>התשלום בוצע בהצלחה!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            <p><strong>סכום ששולם:</strong></p>
            <div class="amount">₪${amount.toFixed(2)}</div>
            <div class="card-info">
              <p>כרטיס מסתיים ב-${cardLast4}</p>
            </div>
          </div>
          <p>תודה שבחרת ב-DealRush! נשמח לראותך שוב.</p>
        </div>
        <div class="footer">
          <p>DealRush - עסקאות קבוצתיות חכמות</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: toEmail,
    subject,
    htmlBody,
  });
}

export { sendOrderStatusUpdateEmail } from './orderEmailTemplate';

