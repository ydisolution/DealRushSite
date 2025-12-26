/**
 * AI Assistant Service for Real Estate Module
 * Provides context-aware assistance without legal advice or binding commitments
 */

import OpenAI from "openai";
import { db } from "./db";
import { aiFaqKnowledge, realEstateProjects, projectRegistrations, aiConversations } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Initialize OpenAI client
let openai: OpenAI | null = null;

try {
  console.log("🔑 Initializing OpenAI with API key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
  
  console.log("✅ OpenAI client initialized successfully");
  console.log("🤖 Using AI model:", process.env.AI_MODEL || "gpt-4o");
} catch (error) {
  console.error("❌ Failed to initialize OpenAI:", error);
  console.log("💡 Make sure OPENAI_API_KEY is set in .env");
}

const MODEL = process.env.AI_MODEL || "gpt-4o";

// System prompt with strict guardrails
const SYSTEM_PROMPT = `אתה עוזר וירטואלי של פלטפורמת DealRush למודול הנדל"ן.

תפקידך:
- להסביר את תהליך הרכישה הקבוצתית בשלביו השונים
- להבהיר מה המצב הנוכחי של המשתמש בתהליך
- להדגיש מועדים חשובים בעדינות (FOMO)
- להסביר מי עו"ד ספיר ומתי היא מעורבת

אסור לך בהחלט:
- לתת ייעוץ משפטי
- להבטיח זמינות דירות או מחירים ספציפיים
- לנהל משא ומתן
- לרמוז על התחייבות משפטית
- לבצע פעולות ללא אישור משתמש מפורש בממשק

תמיד הדגש:
"DealRush אינה צד לעסקת הרכישה. הבחירה והחתימה מתבצעות ישירות מול הקבלן."

השב בעברית תמיד. היה אמפטי, ברור וקצר.`;

interface AssistantContext {
  userId?: string;
  sessionId?: string;
  projectId?: string;
  pageContext?: string;
  userQuestion: string;
}

interface AssistantResponse {
  answer: string;
  tokensUsed?: number;
  model: string;
}

/**
 * Build context for the AI based on user status and project stage
 */
async function buildContext(ctx: AssistantContext): Promise<string> {
  let context = "";

  // Real Estate Project Context (if relevant)
  if (ctx.projectId) {
    try {
      const project = await db.query.realEstateProjects.findFirst({
        where: eq(realEstateProjects.id, ctx.projectId),
      });
      if (project) {
        context += `\n\nפרטי הפרויקט:
שם: ${project.title}
עיר: ${project.city}
שלב נוכחי: ${getStageHebrew(project.currentStage || "EARLY_REGISTRATION")}`;
        // ...existing date logic...
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  }

  // User status in project (if relevant)
  if (ctx.userId && ctx.projectId) {
    try {
      const registration = await db.query.projectRegistrations.findFirst({
        where: and(
          eq(projectRegistrations.userId, ctx.userId),
          eq(projectRegistrations.projectId, ctx.projectId)
        ),
      });
      if (registration) {
        context += `\n\nמצב המשתמש בפרויקט:
סטטוס: ${getFunnelStatusHebrew(registration.funnelStatus || "EARLY_REGISTERED")}`;
        // ...existing funnel status logic...
      }
    } catch (error) {
      console.error("Error fetching registration:", error);
    }
  }

  // GLOBAL CONTEXT: Deals, Orders, Users, Analytics
  try {
    // Deals
    const deals = await (await import("./storage")).storage.getAllDeals();
    if (deals.length > 0) {
      context += `\n\nמבצעי דילים פעילים באתר:`;
      deals.slice(0, 5).forEach(deal => {
        context += `\n- ${deal.name} (${deal.category}) | מחיר נוכחי: ${deal.currentPrice} ש"ח | משתתפים: ${deal.participants}`;
      });
    }
    // Users (anonymized summary)
    const users = await (await import("./storage")).storage.getAllParticipants();
    context += `\n\nמשתמשים פעילים: ${users.length}`;
    // Orders (anonymized summary)
    // This is a stub for real DB, can be expanded for analytics
    context += `\nהמערכת תומכת בהזמנות, סטטיסטיקות זמינות למנהלים.`;
    // Analytics (stub)
    context += `\n\nאנליטיקות: מספר דילים פעילים: ${deals.length}, מספר משתתפים: ${users.length}`;
  } catch (error) {
    console.error("Error building global context:", error);
  }

  // FAQ Knowledge
  try {
    const faqs = await db.query.aiFaqKnowledge.findMany({
      where: eq(aiFaqKnowledge.isActive, "true"),
      orderBy: (faqs, { desc }) => [desc(faqs.priority)],
      limit: 10,
    });
    if (faqs.length > 0) {
      context += `\n\nידע רלוונטי:`;
      faqs.forEach(faq => {
        context += `\n\nשאלה: ${faq.question}\nתשובה: ${faq.answer}`;
      });
    }
  } catch (error) {
    console.error("Error fetching FAQ knowledge:", error);
  }

  return context;
}

/**
 * Get Hebrew translation for stage
 */
function getStageHebrew(stage: string): string {
  const stages: Record<string, string> = {
    EARLY_REGISTRATION: "רישום מוקדם",
    PRESENTATION: "הצגת הפרויקט",
    FINAL_REGISTRATION: "רישום לרכישה",
    POST_REGISTRATION: "בחירה וחתימה מול הקבלן",
  };
  return stages[stage] || stage;
}

/**
 * Get Hebrew translation for funnel status
 */
function getFunnelStatusHebrew(status: string): string {
  const statuses: Record<string, string> = {
    EARLY_REGISTERED: "נרשמת לרישום מוקדם",
    EVENT_RSVP: "אישרת הגעה למצגת",
    EVENT_ATTENDED: "השתתפת במצגת",
    FINAL_REGISTERED: "נרשמת לרכישה (סופי)",
    TRANSFERRED_TO_DEVELOPER: "הועברת לקבלן",
    IN_LEGAL_PROCESS: "בטיפול משפטי",
    SIGNED: "חתמת על חוזה",
    DROPPED: "לא המשכת בתהליך",
  };
  return statuses[status] || status;
}

/**
 * Main function to get AI assistant response
 */
export async function getAssistantResponse(ctx: AssistantContext): Promise<AssistantResponse> {
  try {
    // Check if OpenAI is available
    if (!openai) {
      console.error("❌ OpenAI not initialized - returning fallback response");
      return {
        answer: "מצטער, העוזר הוירטואלי אינו זמין כרגע. אנא ודא שחבילת OpenAI מותקנת (npm install openai) וש-API key מוגדר בקובץ .env",
        model: "fallback",
      };
    }

    console.log("📋 Building context for question:", ctx.userQuestion?.substring(0, 50));
    
    // Build context
    const contextInfo = await buildContext(ctx);
    console.log("✅ Context built, length:", contextInfo.length);

    // Create message with context
    const userMessage = `${contextInfo}\n\nשאלת המשתמש: ${ctx.userQuestion}`;

    console.log("🚀 Calling OpenAI API...");
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
    });

    // Extract answer
    const answer = response.choices[0]?.message?.content 
      || "מצטער, לא הצלחתי לעבד את השאלה. אנא נסה שוב.";

    // Calculate tokens used
    const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

    // Log conversation
    try {
      await db.insert(aiConversations).values({
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        projectId: ctx.projectId,
        pageContext: ctx.pageContext,
        userQuestion: ctx.userQuestion,
        aiResponse: answer,
        modelUsed: MODEL,
        tokensUsed,
      });
    } catch (logError) {
      console.error("Error logging conversation:", logError);
      // Don't fail the request if logging fails
    }

    return {
      answer,
      tokensUsed,
      model: MODEL,
    };
  } catch (error) {
    console.error("❌ AI Assistant error:", error);
    
    // Fallback response
    return {
      answer: "מצטער, נתקלתי בבעיה טכנית. אנא נסה שוב או פנה לשירות הלקוחות שלנו.",
      model: MODEL,
    };
  }
}

/**
 * Get quick contextual help (pre-defined micro-help)
 */
export function getQuickHelp(topic: string): string {
  const quickHelps: Record<string, string> = {
    "early-registration": "רישום מוקדם הוא שלב ללא התחייבות שבו אתה מביע עניין בפרויקט. זה עוזר לנו להבין את רמת הביקוש ולארגן את המצגת.",
    "event-rsvp": "המצגת כוללת הסבר על התהליך, פרטי הפרויקט מהקבלן, והסבר משפטי מעו\"ד ספיר. אין התחייבות בהשתתפות.",
    "final-registration": "זהו הרישום הסופי לרכישה - חלון זמן מוגבל שבו אתה מאשר כוונה להמשיך בתהליך. אנחנו נעביר את הפרטים לקבלן ולעו\"ד.",
    "no-commitment": "DealRush אינה צד לעסקת הרכישה. כל הרישומים אינם מחייבים משפטית. החוזה הרשמי ייחתם ישירות עם הקבלן.",
    "attorney-sapir": "עו\"ד ספיר היא עורכת דין חיצונית שמייצגת את קבוצת הרוכשים מול הקבלן. השירות שלה משולם בנפרד במחיר מוזל.",
    "apartment-selection": "בחירת הדירה הספציפית, הקומה, והמפרט נעשית ישירות מול הקבלן לאחר הרישום הסופי, לא דרך DealRush.",
  };

  return quickHelps[topic] || "עזרה לא זמינה לנושא זה.";
}
