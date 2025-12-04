import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: text("is_admin").default("false"),
  isEmailVerified: text("is_email_verified").default("false"),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
  isEmailVerified: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  stripeCustomerId: true,
}).extend({
  password: z.string().min(8, "הסיסמא חייבת להכיל לפחות 8 תווים"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const tierSchema = z.object({
  minParticipants: z.number().min(0),
  maxParticipants: z.number().min(1),
  discount: z.number().min(0).max(100),
  price: z.number().optional(),
  commission: z.number().min(0).max(100).optional(),
});

export type Tier = z.infer<typeof tierSchema>;

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  originalPrice: integer("original_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  participants: integer("participants").notNull().default(0),
  targetParticipants: integer("target_participants").notNull(),
  minParticipants: integer("min_participants").default(1),
  endTime: timestamp("end_time").notNull(),
  tiers: jsonb("tiers").$type<Tier[]>().notNull().default([]),
  specs: jsonb("specs").$type<Array<{ label: string; value: string }>>().default([]),
  isActive: text("is_active").notNull().default("true"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  closedAt: timestamp("closed_at"),
  supplierName: text("supplier_name"),
  supplierStripeKey: text("supplier_stripe_key"),
  supplierBankAccount: text("supplier_bank_account"),
  platformCommission: integer("platform_commission").default(5),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  closedAt: true,
}).extend({
  tiers: z.array(tierSchema).min(1, "יש להגדיר לפחות מדרגה אחת"),
  images: z.array(z.string()).min(1, "יש להעלות לפחות תמונה אחת"),
  specs: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().default([]),
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export const CATEGORIES = [
  { id: "apartments", name: "דירות מקבלנים", icon: "Building2" },
  { id: "electrical", name: "מוצרי חשמל", icon: "Zap" },
  { id: "furniture", name: "ריהוט", icon: "Sofa" },
  { id: "electronics", name: "אלקטרוניקה", icon: "Smartphone" },
  { id: "home", name: "לבית", icon: "Home" },
  { id: "fashion", name: "אופנה", icon: "Shirt" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

export const PaymentStatus = {
  PENDING: "pending",
  PENDING_PAYPAL: "pending_paypal",
  CARD_VALIDATED: "card_validated",
  CARD_FAILED: "card_failed",
  CHARGED: "charged",
  CHARGE_FAILED: "charge_failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  quantity: integer("quantity").notNull().default(1),
  pricePaid: integer("price_paid").notNull(),
  position: integer("position").notNull(),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
  paymentStatus: text("payment_status").default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSetupIntentId: text("stripe_setup_intent_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"),
  chargedAt: timestamp("charged_at"),
  chargedAmount: integer("charged_amount"),
  tierAtJoin: integer("tier_at_join"),
  finalTier: integer("final_tier"),
});

export const participantSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  userId: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  quantity: z.number().default(1),
  pricePaid: z.number(),
  position: z.number(),
  joinedAt: z.date(),
  paymentStatus: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  stripeSetupIntentId: z.string().nullable(),
  stripePaymentMethodId: z.string().nullable(),
  cardLast4: z.string().nullable(),
  cardBrand: z.string().nullable(),
  chargedAt: z.date().nullable(),
  chargedAmount: z.number().nullable(),
  tierAtJoin: z.number().nullable(),
  finalTier: z.number().nullable(),
});

export type Participant = z.infer<typeof participantSchema>;

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  joinedAt: true,
  chargedAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  dealId: varchar("deal_id"),
  emailType: text("email_type").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject"),
  status: text("status").default("sent"),
  sentAt: timestamp("sent_at").notNull().default(sql`now()`),
  errorMessage: text("error_message"),
});

export type EmailLog = typeof emailLogs.$inferSelect;
