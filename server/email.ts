import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

function createEmailMessage(options: EmailOptions): string {
  const { to, subject, htmlBody, textBody } = options;
  
  const boundary = "boundary_" + Date.now();
  
  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textBody || htmlBody.replace(/<[^>]*>/g, '')).toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody).toString('base64'),
    '',
    `--${boundary}--`,
  ];
  
  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64url');
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    const raw = createEmailMessage(options);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw,
      },
    });
    
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendDealJoinNotification(
  toEmail: string,
  dealName: string,
  totalPrice: number,
  position: number,
  quantity: number = 1
): Promise<boolean> {
  const subject = quantity > 1 
    ? `הצטרפת בהצלחה לדיל: ${dealName} (${quantity} יחידות)`
    : `הצטרפת בהצלחה לדיל: ${dealName}`;
  
  const quantityInfo = quantity > 1 
    ? `<p><strong>כמות:</strong> ${quantity} יחידות</p>`
    : '';
  
  const priceLabel = quantity > 1 ? 'סה"כ לתשלום' : 'המחיר הנוכחי שלך';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .price { font-size: 32px; color: #667eea; font-weight: bold; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DealRush</h1>
          <p>הצטרפת בהצלחה לדיל!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            ${quantityInfo}
            <p><strong>${priceLabel}:</strong></p>
            <p class="price">₪${totalPrice.toLocaleString()}</p>
          </div>
          <div class="info-box">
            <p><strong>מיקום בתור:</strong> #${position}</p>
            <p>ככל שיותר אנשים יצטרפו, המחיר יכול לרדת עוד יותר!</p>
          </div>
          <p>נעדכן אותך כשהמחיר ירד או כשהדיל ייסגר.</p>
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
  originalPrice: number
): Promise<boolean> {
  const savings = originalPrice - finalPrice;
  const discountPercent = Math.round((savings / originalPrice) * 100);
  const subject = `הדיל נסגר! ${dealName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .price { font-size: 36px; color: #667eea; font-weight: bold; }
        .savings { background: #dcfce7; color: #16a34a; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DealRush</h1>
          <p>הדיל נסגר בהצלחה!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            <p><strong>המחיר הסופי שלך:</strong></p>
            <p class="price">₪${finalPrice.toLocaleString()}</p>
            <p class="savings">חסכת ${discountPercent}% - ₪${savings.toLocaleString()}!</p>
          </div>
          <p>נציג יצור איתך קשר בקרוב לסיום הרכישה ותיאום המשלוח.</p>
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
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .notice { background: #fef2f2; color: #dc2626; padding: 15px; border-radius: 8px; margin: 15px 0; }
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
  discountPercent: number
): Promise<boolean> {
  const savings = oldPrice - newPrice;
  const subject = `שלב חדש נפתח! ${dealName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Rubik', 'Heebo', Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .tier-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 25px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px; margin: 10px 0; }
        .price-old { font-size: 18px; color: #999; text-decoration: line-through; }
        .price-new { font-size: 36px; color: #d97706; font-weight: bold; }
        .savings { background: #fef3c7; color: #d97706; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DealRush</h1>
          <p>שלב הנחה חדש נפתח!</p>
        </div>
        <div class="content">
          <h2>${dealName}</h2>
          <div class="info-box">
            <p class="tier-badge">שלב ${tierNumber}</p>
            <p class="price-old">₪${oldPrice.toLocaleString()}</p>
            <p class="price-new">₪${newPrice.toLocaleString()}</p>
            <p class="savings">${discountPercent}% הנחה - חוסכים ₪${savings.toLocaleString()}!</p>
          </div>
          <p>ככל שיותר אנשים מצטרפים, ההנחה גדלה! שתף את הדיל עם חברים כדי לחסוך עוד יותר.</p>
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
            <p class="amount">₪${amount.toLocaleString()}</p>
            <p class="card-info">כרטיס אשראי המסתיים ב-${cardLast4}</p>
          </div>
          <p>תודה על הרכישה! נציג יצור איתך קשר בקרוב לתיאום המשלוח.</p>
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
