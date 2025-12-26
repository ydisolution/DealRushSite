import { sendEmail } from './emailNodemailer';

/**
 * Send order status update notification to customer
 */
export async function sendOrderStatusUpdateEmail(
  toEmail: string,
  customerName: string,
  status: string,
  message: string
): Promise<boolean> {
  const statusTitles: Record<string, string> = {
    verified: 'ההזמנה אומתה',
    scheduled: 'המשלוח תוזמן',
    out_for_delivery: 'המוצר יצא למשלוח',
    delivered: 'המוצר נמסר',
    cancelled: 'ההזמנה בוטלה',
  };

  const statusEmojis: Record<string, string> = {
    verified: '✓',
    scheduled: '📅',
    out_for_delivery: '🚚',
    delivered: '✅',
    cancelled: '❌',
  };

  const subject = `${statusTitles[status] || 'עדכון הזמנה'} - DealRush`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header .icon { font-size: 48px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .status-box { background: #f8f9fa; border-right: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${statusEmojis[status] || '📦'}</div>
          <h1>DealRush</h1>
          <p>${statusTitles[status] || 'עדכון הזמנה'}</p>
        </div>
        <div class="content">
          <p>שלום ${customerName},</p>
          <div class="status-box">
            <strong>${statusTitles[status] || 'עדכון סטטוס'}</strong>
            <div class="message">${message}</div>
          </div>
          <p>תודה שבחרת ב-DealRush!</p>
        </div>
        <div class="footer">
          <p>DealRush - קניות קבוצתיות חכמות</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({ to: toEmail, subject, htmlBody });
}
