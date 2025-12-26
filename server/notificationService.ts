/**
 * NotificationService - Abstraction layer for all notifications
 * 
 * This service provides a clean interface for sending notifications
 * across multiple channels (Email, WhatsApp, SMS).
 * 
 * In development: logs to console
 * In production: integrates with real services
 */

import { sendEmail } from "./email";
import { whatsappService } from "./whatsappService";
import { smsService } from "./smsService";

export interface NotificationRecipient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface EmailNotification {
  to: NotificationRecipient;
  subject: string;
  html: string;
  text?: string;
}

export interface WhatsAppNotification {
  to: NotificationRecipient;
  message: string;
}

export interface SMSNotification {
  to: NotificationRecipient;
  message: string;
}

export interface CalendarInvite {
  to: NotificationRecipient;
  event: {
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
    organizerName: string;
    organizerEmail: string;
  };
}

/**
 * NotificationService class
 * Central hub for all notification types
 */
export class NotificationService {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * Send Email
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    if (this.isDevelopment) {
      console.log("📧 [DEV] Email notification:", {
        to: notification.to.email,
        subject: notification.subject,
        preview: notification.html.substring(0, 100) + "...",
      });
      return true;
    }

    try {
      await sendEmail({
        to: notification.to.email,
        subject: notification.subject,
        htmlBody: notification.html,
        textBody: notification.text,
      });
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send WhatsApp Message (1:1)
   */
  async sendWhatsApp(notification: WhatsAppNotification): Promise<boolean> {
    if (this.isDevelopment) {
      console.log("💬 [DEV] WhatsApp notification:", {
        to: notification.to.phone,
        name: `${notification.to.firstName} ${notification.to.lastName}`,
        preview: notification.message.substring(0, 100) + "...",
      });
      return true;
    }

    try {
      await whatsappService.sendWhatsApp({
        to: notification.to.phone,
        message: notification.message,
      });
      return true;
    } catch (error) {
      console.error("Failed to send WhatsApp:", error);
      return false;
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(notification: SMSNotification): Promise<boolean> {
    if (this.isDevelopment) {
      console.log("📱 [DEV] SMS notification:", {
        to: notification.to.phone,
        name: `${notification.to.firstName} ${notification.to.lastName}`,
        message: notification.message,
      });
      return true;
    }

    try {
      await smsService.sendSMS({
        to: notification.to.phone,
        message: notification.message,
      });
      return true;
    } catch (error) {
      console.error("Failed to send SMS:", error);
      return false;
    }
  }

  /**
   * Send Calendar Invite (.ics file via email)
   */
  async sendCalendarInvite(invite: CalendarInvite): Promise<boolean> {
    if (this.isDevelopment) {
      console.log("📅 [DEV] Calendar invite:", {
        to: invite.to.email,
        event: invite.event.title,
        startTime: invite.event.startTime,
      });
      return true;
    }

    try {
      const icsContent = this.generateICS(invite.event);
      
      // Note: attachments not supported in current email implementation
      // This is a placeholder for future enhancement
      await sendEmail({
        to: invite.to.email,
        subject: `הזמנה: ${invite.event.title}`,
        htmlBody: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הוזמנת לאירוע!</h2>
            <p><strong>כותרת:</strong> ${invite.event.title}</p>
            <p><strong>תיאור:</strong> ${invite.event.description}</p>
            <p><strong>מיקום:</strong> ${invite.event.location}</p>
            <p><strong>תאריך ושעה:</strong> ${invite.event.startTime.toLocaleString('he-IL')}</p>
            <p>פרטי האירוע:</p>
            <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px;">${icsContent}</pre>
          </div>
        `,
      });
      
      return true;
    } catch (error) {
      console.error("Failed to send calendar invite:", error);
      return false;
    }
  }

  /**
   * Broadcast to multiple recipients (loops and sends 1:1)
   */
  async broadcast(
    recipients: NotificationRecipient[],
    messageGenerator: (recipient: NotificationRecipient) => {
      email?: EmailNotification;
      whatsapp?: WhatsAppNotification;
      sms?: SMSNotification;
    }
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const messages = messageGenerator(recipient);

        if (messages.email) {
          const emailSent = await this.sendEmail(messages.email);
          if (emailSent) success++;
          else failed++;
        }

        if (messages.whatsapp) {
          const whatsappSent = await this.sendWhatsApp(messages.whatsapp);
          if (whatsappSent) success++;
          else failed++;
        }

        if (messages.sms) {
          const smsSent = await this.sendSMS(messages.sms);
          if (smsSent) success++;
          else failed++;
        }

        // Rate limiting: small delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Generate ICS (iCalendar) file content
   */
  private generateICS(event: CalendarInvite['event']): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DealRush//Real Estate Event//HE
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
DTSTAMP:${formatDate(new Date())}
ORGANIZER;CN=${event.organizerName}:mailto:${event.organizerEmail}
UID:${Date.now()}@dealrush.com
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Real Estate specific notification templates

/**
 * Send welcome notification after pre-registration
 */
export async function sendWelcomeNotification(recipient: NotificationRecipient, projectTitle: string) {
  const service = new NotificationService();
  
  await service.sendEmail({
    to: recipient,
    subject: `ברוכים הבאים לקבוצת הרכישה - ${projectTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>שלום ${recipient.firstName},</h2>
        <p>תודה שהצטרפת לקבוצת הרכישה של ${projectTitle}!</p>
        <p>נעדכן אותך בקרוב לגבי מועד המצגת והשלבים הבאים.</p>
        <p><strong>מה קורה עכשיו?</strong></p>
        <ul>
          <li>תקבל הזמנה למצגת הפרויקט</li>
          <li>במצגת תכיר את הפרויקט לעומק</li>
          <li>לאחר המצגת יפתח חלון אישור השתתפות</li>
        </ul>
        <p>בברכה,<br/>צוות DealRush</p>
      </div>
    `,
  });

  await service.sendWhatsApp({
    to: recipient,
    message: `שלום ${recipient.firstName}! תודה שהצטרפת לקבוצת הרכישה של ${projectTitle}. נעדכן אותך בקרוב 🏠`,
  });
}

/**
 * Send webinar invitation
 */
export async function sendWebinarInvitation(
  recipient: NotificationRecipient,
  projectTitle: string,
  webinarDate: Date,
  webinarLink: string
) {
  const service = new NotificationService();

  await service.sendCalendarInvite({
    to: recipient,
    event: {
      title: `מצגת פרויקט ${projectTitle}`,
      description: `מצגת מקיפה של הפרויקט, פרטים מהיזם, וסיכוי להצטרפות לקבוצת רכישה.`,
      location: webinarLink,
      startTime: webinarDate,
      endTime: new Date(webinarDate.getTime() + 90 * 60 * 1000), // 90 minutes
      organizerName: "צוות DealRush",
      organizerEmail: "info@dealrush.com",
    },
  });

  await service.sendWhatsApp({
    to: recipient,
    message: `שלום ${recipient.firstName}! מוזמן למצגת ${projectTitle} בתאריך ${webinarDate.toLocaleDateString('he-IL')}. לינק: ${webinarLink}`,
  });
}

/**
 * Send webinar reminder (day of event)
 */
export async function sendWebinarReminder(
  recipient: NotificationRecipient,
  projectTitle: string,
  webinarLink: string,
  hoursUntil: number
) {
  const service = new NotificationService();

  await service.sendEmail({
    to: recipient,
    subject: `תזכורת: מצגת ${projectTitle} מתחילה בעוד ${hoursUntil} שעות!`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>שלום ${recipient.firstName},</h2>
        <p>תזכורת! המצגת של ${projectTitle} מתחילה בעוד ${hoursUntil} שעות.</p>
        <p><a href="${webinarLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">כניסה למצגת</a></p>
      </div>
    `,
  });

  await service.sendWhatsApp({
    to: recipient,
    message: `תזכורת! המצגת של ${projectTitle} בעוד ${hoursUntil} שעות. לינק: ${webinarLink}`,
  });
}

/**
 * Send confirmation window notification
 */
export async function sendConfirmationWindowNotification(
  recipient: NotificationRecipient,
  projectTitle: string,
  endDate: Date
) {
  const service = new NotificationService();

  await service.sendEmail({
    to: recipient,
    subject: `נפתח חלון אישור השתתפות - ${projectTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>שלום ${recipient.firstName},</h2>
        <p>חלון אישור ההשתתפות לפרויקט ${projectTitle} נפתח!</p>
        <p><strong>זמן אישור עד:</strong> ${endDate.toLocaleString('he-IL')}</p>
        <p>המקומות מוגבלים ומתמלאים לפי סדר הגעה.</p>
        <p><a href="https://dealrush.com/real-estate/${projectTitle}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">אישור השתתפות</a></p>
      </div>
    `,
  });

  await service.sendWhatsApp({
    to: recipient,
    message: `${recipient.firstName}, נפתח חלון אישור השתתפות ל-${projectTitle}! המקומות מוגבלים. אשר עכשיו: https://dealrush.com/real-estate`,
  });
}

/**
 * Send registration closure notification with queue position
 */
export async function sendRegistrationClosureNotification(
  recipient: NotificationRecipient,
  projectTitle: string,
  queuePosition: number,
  selectedApartmentType: string,
  isWaitingList: boolean
) {
  const service = new NotificationService();

  const status = isWaitingList ? "רשימת המתנה" : "מאושר";

  await service.sendEmail({
    to: recipient,
    subject: `ההרשמה נסגרה - ${projectTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>שלום ${recipient.firstName},</h2>
        <p>ההרשמה לפרויקט ${projectTitle} נסגרה.</p>
        <p><strong>סטטוס:</strong> ${status}</p>
        <p><strong>מיקום בתור:</strong> ${queuePosition}</p>
        <p><strong>סוג דירה שנבחר:</strong> ${selectedApartmentType} חדרים</p>
        ${isWaitingList ? '<p style="color: #f59e0b;">⚠️ אתה ברשימת המתנה. נעדכן אותך אם מתפנה מקום.</p>' : ''}
        <p>היזם ייצור איתך קשר בקרוב לתיאום מפגש ובחירת דירה ספציפית.</p>
        <p>בהצלחה!</p>
      </div>
    `,
  });

  await service.sendWhatsApp({
    to: recipient,
    message: `${recipient.firstName}, ההרשמה ל-${projectTitle} נסגרה. סטטוס: ${status}, מיקום בתור: ${queuePosition}. היזם ייצור איתך קשר בקרוב! 🏠`,
  });
}
