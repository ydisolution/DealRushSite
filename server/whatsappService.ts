import twilio from 'twilio';

interface WhatsAppOptions {
  to: string;
  message: string;
  mediaUrl?: string; // Optional image/video URL
}

interface WhatsAppTemplateOptions {
  to: string;
  templateName?: string;
  variables?: string[];
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private enabled: boolean = false;
  private fromNumber: string = '';
  private businessName: string = 'DealRush';

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox default
    this.businessName = process.env.BUSINESS_NAME || 'DealRush';

    console.log('🔍 WhatsApp Service Initialization:');
    console.log('   TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'NOT SET');
    console.log('   TWILIO_AUTH_TOKEN:', authToken ? 'SET (hidden)' : 'NOT SET');
    console.log('   TWILIO_WHATSAPP_NUMBER:', this.fromNumber);

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.enabled = true;
      console.log('✅ WhatsApp service initialized (Twilio)');
      console.log(`   From: ${this.fromNumber}`);
    } else {
      console.log('⚠️  WhatsApp service disabled - Twilio credentials not configured');
      console.log('   Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendWhatsApp({ to, message, mediaUrl }: WhatsAppOptions): Promise<boolean> {
    if (!this.enabled || !this.client) {
      console.log('⚠️  WhatsApp not sent (service disabled):', to);
      return false;
    }

    // Format phone number for WhatsApp
    const formattedPhone = this.formatWhatsAppNumber(to);

    try {
      const messageOptions: any = {
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      };

      // Add media if provided
      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const result = await this.client.messages.create(messageOptions);

      console.log(`✅ WhatsApp sent to ${formattedPhone}: ${result.sid}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send WhatsApp to ${formattedPhone}:`, error.message);
      return false;
    }
  }

  /**
   * Format phone number for WhatsApp (add whatsapp: prefix)
   */
  private formatWhatsAppNumber(phone: string): string {
    // Remove any existing whatsapp: prefix
    let cleanPhone = phone.replace('whatsapp:', '');
    
    // Ensure it starts with +
    if (!cleanPhone.startsWith('+')) {
      // Convert Israeli number (remove leading 0, add +972)
      cleanPhone = cleanPhone.startsWith('0') 
        ? `+972${cleanPhone.substring(1)}` 
        : `+972${cleanPhone}`;
    }
    
    return `whatsapp:${cleanPhone}`;
  }

  // ==================== ORDER NOTIFICATIONS ====================

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(
    phone: string, 
    customerName: string,
    orderId: string,
    dealName: string,
    quantity: number,
    totalAmount: number,
    position: number
  ) {
    const message = `🎉 *שלום ${customerName}!*

הזמנתך התקבלה בהצלחה! 

📦 *פרטי ההזמנה:*
• מוצר: ${dealName}
• כמות: ${quantity}
• מיקום: #${position}
• סכום: ₪${totalAmount.toLocaleString()}
• מספר הזמנה: ${orderId.slice(0, 8)}

✅ נעדכן אותך על סטטוס המשלוח בהמשך.

*${this.businessName}* - הדילים הכי שווים! 🔥`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(
    phone: string,
    customerName: string,
    orderId: string,
    dealName: string,
    status: string,
    statusEmoji: string,
    statusText: string
  ) {
    const message = `${statusEmoji} *עדכון הזמנה*

שלום ${customerName},

ההזמנה שלך עודכנה:

📦 *${dealName}*
🔢 מספר הזמנה: ${orderId.slice(0, 8)}
📍 סטטוס: *${statusText}*

${this.getStatusMessage(status)}

*${this.businessName}* 🚀`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send shipment notification with tracking
   */
  async sendShipmentNotification(
    phone: string,
    customerName: string,
    dealName: string,
    trackingNumber: string,
    carrier: string,
    estimatedDelivery?: string
  ) {
    const deliveryText = estimatedDelivery 
      ? `\n🗓️ זמן אספקה משוער: ${estimatedDelivery}` 
      : '';

    const message = `🚚 *המשלוח יצא לדרך!*

שלום ${customerName},

החבילה שלך נשלחה!

📦 *${dealName}*
🚛 חברת שילוח: ${carrier}
📍 מספר מעקב: *${trackingNumber}*${deliveryText}

ניתן לעקוב אחרי המשלוח בכל רגע.

*${this.businessName}* - מגיע אליך בקרוב! 📦✨`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send delivery confirmation
   */
  async sendDeliveryConfirmation(
    phone: string,
    customerName: string,
    dealName: string,
    orderId: string
  ) {
    const message = `✅ *החבילה נמסרה בהצלחה!*

שלום ${customerName},

החבילה שלך הגיעה ליעדה! 🎉

📦 *${dealName}*
🔢 הזמנה: ${orderId.slice(0, 8)}

תודה שבחרת ב-*${this.businessName}*!

💬 יש משוב? נשמח לשמוע ממך!
⭐ דרג אותנו ועזור ללקוחות אחרים.

בהצלחה! 🚀✨`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send order needs coordination message
   */
  async sendCoordinationRequest(
    phone: string,
    customerName: string,
    dealName: string,
    orderId: string,
    supplierPhone?: string
  ) {
    const contactText = supplierPhone 
      ? `\n📞 ליצירת קשר: ${supplierPhone}` 
      : '\n📞 נציג יצור איתך קשר בקרוב';

    const message = `📞 *נדרש תיאום משלוח*

שלום ${customerName},

ההזמנה שלך דורשת תיאום:

📦 *${dealName}*
🔢 מספר הזמנה: ${orderId.slice(0, 8)}${contactText}

אנא השב להודעה זו או צור קשר למספר הנ"ל לתיאום זמן נוח.

*${this.businessName}* 🤝`;

    return this.sendWhatsApp({ to: phone, message });
  }

  // ==================== DEAL NOTIFICATIONS ====================

  /**
   * Send deal joined notification
   */
  async sendDealJoinedWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    position: number,
    currentPrice: number,
    imageUrl?: string
  ) {
    const message = `🎉 *הצטרפת בהצלחה לדיל!*

שלום ${customerName},

ברוך הבא לדיל הכי שווה! 

🔥 *${dealName}*
📍 מיקומך: #${position}
💰 מחיר נוכחי: ₪${currentPrice.toLocaleString()}

ככל שיותר אנשים יצטרפו - המחיר ירד!
שתף עם חברים והנה להם הנחה! 🎁

*${this.businessName}* - ביחד חוסכים יותר! 💪`;

    return this.sendWhatsApp({ 
      to: phone, 
      message,
      mediaUrl: imageUrl 
    });
  }

  /**
   * Send price drop notification
   */
  async sendPriceDropWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    oldPrice: number,
    newPrice: number,
    savings: number
  ) {
    const message = `🔥 *המחיר ירד!*

שלום ${customerName},

יש חדשות טובות! 

📦 *${dealName}*
💸 מחיר קודם: ₪${oldPrice.toLocaleString()}
💰 מחיר חדש: *₪${newPrice.toLocaleString()}*
🎉 חסכת: ₪${savings.toLocaleString()}!

המחיר יכול לרדת עוד - שתף עם חברים! 🚀

*${this.businessName}* 🔥`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send deal closing soon notification
   */
  async sendDealClosingSoonWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    hoursLeft: number,
    currentPrice: number
  ) {
    const timeText = hoursLeft < 1 ? 'פחות משעה' : `${hoursLeft} שעות`;
    
    const message = `⏰ *הדיל נסגר בקרוב!*

שלום ${customerName},

זוהי ההזדמנות האחרונה!

🔥 *${dealName}*
⏳ זמן שנותר: *${timeText}*
💰 מחיר נוכחי: ₪${currentPrice.toLocaleString()}

אל תפספס! שתף עם חברים לפני שהדיל נסגר 🚀

*${this.businessName}* ⚡`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send deal closed notification
   */
  async sendDealClosedWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    finalPrice: number,
    originalPrice: number,
    savings: number
  ) {
    const message = `✅ *הדיל נסגר!*

שלום ${customerName},

הדיל הושלם בהצלחה! 🎉

📦 *${dealName}*
💰 מחיר סופי: *₪${finalPrice.toLocaleString()}*
🏷️ מחיר מקורי: ₪${originalPrice.toLocaleString()}
🎁 חסכת: ₪${savings.toLocaleString()}!

הכרטיס שלך חויב.
נעדכן אותך על סטטוס המשלוח בקרוב.

*${this.businessName}* - תודה שבחרת בנו! 💜`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send deal cancelled notification
   */
  async sendDealCancelledWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    reason: string
  ) {
    const message = `❌ *הדיל בוטל*

שלום ${customerName},

לצערנו, הדיל בוטל:

📦 *${dealName}*
📝 סיבה: ${reason}

💳 *לא חויבת* - הכרטיס שלך לא נגבה.
📧 פרטים נוספים נשלחו במייל.

תודה על הסבלנות!

*${this.businessName}* 💙`;

    return this.sendWhatsApp({ to: phone, message });
  }

  // ==================== PAYMENT NOTIFICATIONS ====================

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    phone: string,
    customerName: string,
    amount: number,
    orderId: string
  ) {
    const message = `💳 *תשלום אושר!*

שלום ${customerName},

התשלום שלך עבר בהצלחה! ✅

💰 סכום: ₪${amount.toLocaleString()}
🔢 הזמנה: ${orderId.slice(0, 8)}

קבלה נשלחה למייל.

*${this.businessName}* 🙏`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedWhatsApp(
    phone: string,
    customerName: string,
    dealName: string,
    reason: string
  ) {
    const message = `⚠️ *החיוב נכשל*

שלום ${customerName},

החיוב עבור ההזמנה נכשל:

📦 *${dealName}*
❌ סיבה: ${reason}

🔧 *פעולות נדרשות:*
1. בדוק את פרטי האשראי באתר
2. עדכן את הכרטיס במידת הצורך
3. נסה שוב

צריך עזרה? אנחנו כאן! 💬

*${this.businessName}* 🛠️`;

    return this.sendWhatsApp({ to: phone, message });
  }

  // ==================== SUPPLIER NOTIFICATIONS ====================

  /**
   * Send new order notification to supplier
   */
  async sendSupplierNewOrder(
    phone: string,
    supplierName: string,
    orderId: string,
    dealName: string,
    customerName: string,
    quantity: number,
    totalAmount: number
  ) {
    const message = `🔔 *הזמנה חדשה!*

שלום ${supplierName},

התקבלה הזמנה חדשה:

📦 *${dealName}*
👤 לקוח: ${customerName}
🔢 כמות: ${quantity}
💰 סכום: ₪${totalAmount.toLocaleString()}
🆔 מספר: ${orderId.slice(0, 8)}

היכנס לפאנל לאישור וניהול ההזמנה.

*${this.businessName}* - פאנל ספקים 📊`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send urgent order notification to supplier
   */
  async sendSupplierUrgentOrder(
    phone: string,
    supplierName: string,
    orderId: string,
    dealName: string,
    reason: string
  ) {
    const message = `🚨 *הזמנה דחופה!*

שלום ${supplierName},

דורש תשומת לב מיידית:

📦 *${dealName}*
⚠️ סיבה: ${reason}
🆔 מספר: ${orderId.slice(0, 8)}

אנא היכנס לפאנל ועדכן את ההזמנה.

*${this.businessName}* ⏰`;

    return this.sendWhatsApp({ to: phone, message });
  }

  // ==================== VERIFICATION & SECURITY ====================

  /**
   * Send verification code
   */
  async sendVerificationCodeWhatsApp(phone: string, code: string, expiryMinutes: number = 10) {
    const message = `🔐 *קוד אימות DealRush*

קוד האימות שלך: *${code}*

⏰ הקוד תקף ל-${expiryMinutes} דקות.
🔒 אל תשתף את הקוד עם אף אחד.

*${this.businessName}* 🛡️`;

    return this.sendWhatsApp({ to: phone, message });
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(phone: string, customerName: string) {
    const message = `👋 *ברוך הבא ל-DealRush!*

שלום ${customerName}!

תודה שהצטרפת אלינו! 🎉

🔥 מה אנחנו?
דילים קבוצתיים - ככל שיותר אנשים קונים, המחיר יורד!

💡 *איך זה עובד?*
1️⃣ בחר דיל שאתה אוהב
2️⃣ הצטרף ושתף עם חברים
3⃣ המחיר יורד אוטומטית
4️⃣ קבל את המוצר במחיר הכי טוב!

📱 עקוב אחרינו לעדכונים על דילים חמים!

*יאללה, בואו נחסוך ביחד!* 💪🔥

*${this.businessName}* 🚀`;

    return this.sendWhatsApp({ to: phone, message });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get status-specific message
   */
  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: '⏳ ההזמנה שלך ממתינה לאישור.',
      verified: '✅ התשלום אומת בהצלחה!',
      needs_coordination: '📞 נציג יצור איתך קשר בקרוב לתיאום.',
      scheduled: '📅 המשלוח תוזמן ויצא בקרוב.',
      out_for_delivery: '🚚 החבילה שלך בדרך אליך!',
      delivered: '✅ החבילה נמסרה בהצלחה!',
      cancelled: '❌ ההזמנה בוטלה.',
    };
    
    return messages[status] || 'ההזמנה שלך בטיפול.';
  }

  /**
   * Send custom WhatsApp message
   */
  async sendCustomMessage(phone: string, message: string, mediaUrl?: string) {
    return this.sendWhatsApp({ to: phone, message, mediaUrl });
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;
