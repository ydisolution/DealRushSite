# WhatsApp Integration Setup Guide

## Overview
DealRush now supports WhatsApp notifications using Twilio's WhatsApp API. This allows sending order updates, shipment tracking, and custom messages directly to customers via WhatsApp.

## Features

### 🎯 Automated Notifications
- **Order Status Updates**: Automatic notifications when order status changes
- **Shipment Tracking**: Send tracking number and carrier info when order ships
- **Delivery Confirmation**: Notify customer when order is delivered
- **Coordination Requests**: Send coordination requests for deliveries

### 💬 Manual Messaging
- **Custom Messages**: Send personalized WhatsApp messages to customers
- **Quick Actions**: Pre-built templates for common scenarios
- **Order Context**: Optionally include order details in messages

### 📊 Supplier Features
- WhatsApp button in Order Details modal
- One-click coordination requests
- Custom message composer with preview
- Integration with order timeline

## Setup Instructions

### Step 1: Twilio Account Setup

1. **Create Twilio Account**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for a free account
   - Verify your email and phone number

2. **Get Twilio Credentials**
   - Navigate to Console Dashboard
   - Copy your **Account SID**
   - Copy your **Auth Token**

### Step 2: WhatsApp Sandbox Setup (For Testing)

1. **Enable WhatsApp Sandbox**
   - In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
   - Follow instructions to join the sandbox
   - Save the **WhatsApp Sandbox Number** (format: `whatsapp:+14155238886`)

2. **Join Sandbox**
   - Send a WhatsApp message to the sandbox number with the join code
   - Example: Send "join <your-code>" to +1 415 523 8886

### Step 3: Production WhatsApp Setup (Optional)

For production use, you need an approved WhatsApp Business Account:

1. **Request Access**
   - In Twilio Console, go to **Messaging** → **WhatsApp** → **Senders**
   - Click "Request to enable my Twilio numbers for WhatsApp"

2. **Facebook Business Manager**
   - You'll need a Facebook Business Manager account
   - Connect your business to Twilio
   - Submit for WhatsApp approval (can take 1-3 days)

3. **Get WhatsApp-Enabled Number**
   - Purchase a Twilio phone number
   - Enable it for WhatsApp messaging
   - Update your `.env` with the new number

### Step 4: Configure Environment Variables

Add these to your `.env` file:

```bash
# Twilio Configuration (Required for SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Configuration (New)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional: Customize business name in messages
BUSINESS_NAME=DealRush
```

### Step 5: Test the Integration

1. **Start the Server**
   ```bash
   npm run dev
   ```

2. **Test Sandbox**
   - Make sure your test phone number joined the Twilio sandbox
   - Create a test order with your phone number
   - Change order status → You should receive WhatsApp message

3. **Test Manual Messages**
   - Open an order in the Supplier Dashboard
   - Click "שלח הודעת WhatsApp" button
   - Send a test message
   - Check your WhatsApp

## Usage Guide

### For Suppliers

#### Viewing WhatsApp Status
```typescript
GET /api/suppliers/whatsapp/status
```
Response:
```json
{
  "enabled": true,
  "service": "Twilio WhatsApp"
}
```

#### Sending Custom Messages
1. Open order details modal
2. Click WhatsApp button (green icon)
3. Choose:
   - **Quick Action**: Send coordination request
   - **Custom Message**: Write your own message
4. Enable/disable order details inclusion
5. Preview message before sending

#### API Endpoints

**Send Custom Message:**
```typescript
POST /api/suppliers/orders/:orderId/send-whatsapp
Body: {
  message: "Your message here",
  includeOrderDetails: true
}
```

**Request Coordination:**
```typescript
POST /api/suppliers/orders/:orderId/request-coordination
```

### Automatic Notifications

The system automatically sends WhatsApp messages for:

| Event | Trigger | Template |
|-------|---------|----------|
| Order Confirmation | Order created | `sendOrderConfirmation()` |
| Status Update | Status changed | `sendOrderStatusUpdate()` |
| Shipment | Marked as shipped | `sendShipmentNotification()` |
| Delivery | Marked as delivered | `sendDeliveryConfirmation()` |
| Coordination | Needs coordination | `sendCoordinationRequest()` |

## Message Templates

### Order Confirmation
```
🎉 *שלום {customerName}!*

הזמנתך התקבלה בהצלחה! 

📦 *פרטי ההזמנה:*
• מוצר: {dealName}
• כמות: {quantity}
• מיקום: #{position}
• סכום: ₪{totalAmount}
• מספר הזמנה: {orderId}

✅ נעדכן אותך על סטטוס המשלוח בהמשך.

*DealRush* - הדילים הכי שווים! 🔥
```

### Shipment Notification
```
🚚 *המשלוח יצא לדרך!*

שלום {customerName},

החבילה שלך נשלחה!

📦 *{dealName}*
🚛 חברת שילוח: {carrier}
📍 מספר מעקב: *{trackingNumber}*
🗓️ זמן אספקה משוער: {estimatedDelivery}

ניתן לעקוב אחרי המשלוח בכל רגע.

*DealRush* - מגיע אליך בקרוב! 📦✨
```

### Status Update
```
{statusEmoji} *עדכון הזמנה*

שלום {customerName},

ההזמנה שלך עודכנה:

📦 *{dealName}*
🔢 מספר הזמנה: {orderId}
📍 סטטוס: *{statusText}*

{statusMessage}

*DealRush* 🚀
```

## Troubleshooting

### WhatsApp Not Sending

**Problem**: Messages not being sent

**Solutions**:
1. Check Twilio credentials in `.env`
2. Verify account is active and has credits
3. Ensure recipient joined sandbox (for testing)
4. Check server logs for error messages
5. Verify phone number format (+972xxxxxxxxx)

### Sandbox Issues

**Problem**: Can't join Twilio sandbox

**Solutions**:
1. Make sure you're sending to correct number
2. Use exact join code from Twilio Console
3. WhatsApp account must have internet connection
4. Try re-joining with "join {code}"

### Production Setup Delays

**Problem**: WhatsApp approval taking long

**Solutions**:
1. Meta typically takes 1-3 business days
2. Ensure Business Manager is properly set up
3. Provide accurate business information
4. Check for any pending verification steps

### Phone Number Formatting

**Problem**: Messages not delivered due to wrong format

**Solutions**:
- System auto-formats Israeli numbers
- Original: `0501234567`
- Formatted: `whatsapp:+972501234567`
- International: Keep existing format

## Cost Information

### Twilio Pricing (as of 2024)
- **WhatsApp Messages**: ~$0.005 - $0.01 per message (varies by country)
- **Free Trial Credits**: $15.50 (good for ~1500+ messages)
- **No monthly fees**: Pay only for what you use

### Cost Optimization
- Send only important notifications
- Batch similar updates
- Use templates for efficiency
- Monitor usage in Twilio Console

## Best Practices

### Message Content
✅ **Do:**
- Keep messages concise and clear
- Include relevant order information
- Use emojis for visual appeal
- Provide tracking numbers
- Include business name

❌ **Don't:**
- Send marketing spam
- Message too frequently
- Include sensitive payment info
- Use promotional content (against WhatsApp policy)

### Timing
- Send during business hours (9 AM - 8 PM)
- Respect customer time zones
- Don't send at night
- Group multiple updates when possible

### Compliance
- Get customer consent for WhatsApp messages
- Respect opt-out requests
- Follow WhatsApp Business Policy
- Don't share customer data

## Advanced Features

### Custom Templates
Create your own message templates in `whatsappService.ts`:

```typescript
async sendCustomNotification(
  phone: string,
  templateName: string,
  variables: Record<string, string>
) {
  const template = this.templates[templateName];
  const message = this.fillTemplate(template, variables);
  return this.sendWhatsApp({ to: phone, message });
}
```

### Media Messages
Send images with messages:

```typescript
whatsappService.sendWhatsApp({
  to: phone,
  message: "Check out your order!",
  mediaUrl: "https://example.com/image.jpg"
});
```

### Rich Formatting
WhatsApp supports:
- **Bold**: `*text*`
- _Italic_: `_text_`
- ~~Strikethrough~~: `~text~`
- `Monospace`: ``` ```text``` ```

## Support

### Resources
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy/)
- [Twilio Console](https://console.twilio.com/)

### Getting Help
1. Check server logs: `npm run dev` output
2. Review Twilio Console logs
3. Test with Twilio Sandbox first
4. Contact Twilio support if needed

---

## Quick Start Checklist

- [ ] Created Twilio account
- [ ] Copied Account SID and Auth Token
- [ ] Joined WhatsApp Sandbox
- [ ] Added credentials to `.env`
- [ ] Restarted server
- [ ] Tested with your phone number
- [ ] Verified messages received
- [ ] Tested in Supplier Dashboard
- [ ] Enabled for production (optional)

## Next Steps

1. Test all notification types
2. Customize message templates
3. Set up production WhatsApp number
4. Monitor usage and costs
5. Collect customer feedback
6. Optimize message content

---

**Happy Messaging! 🚀📱**
