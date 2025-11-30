import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const tierSchema = z.object({
  minParticipants: z.number().min(0),
  maxParticipants: z.number().min(1),
  discount: z.number().min(0).max(100),
  price: z.number().optional(),
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
  name: z.string(),
  pricePaid: z.number(),
  position: z.number(),
  joinedAt: z.date(),
});

export type Participant = z.infer<typeof participantSchema>;

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
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
