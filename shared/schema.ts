import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: text("is_admin").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  endTime: timestamp("end_time").notNull(),
  tiers: jsonb("tiers").$type<Tier[]>().notNull().default([]),
  specs: jsonb("specs").$type<Array<{ label: string; value: string }>>().default([]),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  supplierName: text("supplier_name"),
  supplierStripeKey: text("supplier_stripe_key"),
  supplierBankAccount: text("supplier_bank_account"),
  platformCommission: integer("platform_commission").default(5),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
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

export const participantSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  userId: z.string().nullable(),
  name: z.string(),
  pricePaid: z.number(),
  position: z.number(),
  joinedAt: z.date(),
});

export type Participant = z.infer<typeof participantSchema>;

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  pricePaid: integer("price_paid").notNull(),
  position: integer("position").notNull(),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  joinedAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
