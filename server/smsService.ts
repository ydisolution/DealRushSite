import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private enabled: boolean = false;
  private fromNumber: string = '';

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      this.client = twilio(accountSid, authToken);
      this.enabled = true;
      console.log('✅ SMS service initialized (Twilio)');
    } else {
      console.log('⚠️  SMS service disabled - Twilio credentials not configured');
    }
  }

  async sendSMS({ to, message }: SMSOptions): Promise<boolean> {
    if (!this.enabled || !this.client) {
      console.log('⚠️  SMS not sent (service disabled):', to);
      return false;
    }

    // Ensure phone number starts with +
    const formattedPhone = to.startsWith('+') ? to : `+972${to.replace(/^0/, '')}`;

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      });

      console.log(`✅ SMS sent to ${formattedPhone}: ${result.sid}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send SMS to ${formattedPhone}:`, error.message);
      return false;
    }
  }

  // Notification templates
  async sendDealJoinedSMS(phone: string, dealName: string, position: number) {
    return this.sendSMS({
      to: phone,
      message: `🎉 הצטרפת בהצלחה לדיל "${dealName}"! מיקומך: ${position}. המחיר הסופי יקבע בסגירת הדיל. DealRush`,
    });
  }

  async sendPriceDropSMS(phone: string, dealName: string, newPrice: number) {
    return this.sendSMS({
      to: phone,
      message: `🔥 המחיר של "${dealName}" ירד ל-₪${newPrice}! DealRush`,
    });
  }

  async sendDealClosingSoonSMS(phone: string, dealName: string, hoursLeft: number) {
    return this.sendSMS({
      to: phone,
      message: `⏰ הדיל "${dealName}" נסגר בעוד ${hoursLeft} שעות! הזדמנות אחרונה להצטרף. DealRush`,
    });
  }

  async sendDealClosedSMS(phone: string, dealName: string, finalPrice: number) {
    return this.sendSMS({
      to: phone,
      message: `✅ הדיל "${dealName}" נסגר! המחיר הסופי: ₪${finalPrice}. הכרטיס שלך חויב. DealRush`,
    });
  }

  async sendDealCancelledSMS(phone: string, dealName: string) {
    return this.sendSMS({
      to: phone,
      message: `❌ הדיל "${dealName}" בוטל. לא חויבת. פרטים נוספים נשלחו במייל. DealRush`,
    });
  }

  async sendPaymentFailedSMS(phone: string, dealName: string) {
    return this.sendSMS({
      to: phone,
      message: `⚠️ החיוב עבור "${dealName}" נכשל. אנא עדכן את פרטי התשלום באתר. DealRush`,
    });
  }

  async sendVerificationCodeSMS(phone: string, code: string) {
    return this.sendSMS({
      to: phone,
      message: `קוד האימות שלך ב-DealRush: ${code}. הקוד תקף ל-10 דקות.`,
    });
  }

  async sendTierUnlockedSMS(phone: string, dealName: string, newPrice: number, discount: number) {
    return this.sendSMS({
      to: phone,
      message: `🎊 מדרגת הנחה חדשה נפתחה ב"${dealName}"! ${discount}% הנחה - ₪${newPrice}. DealRush`,
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const smsService = new SMSService();
