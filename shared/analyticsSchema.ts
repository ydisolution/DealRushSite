import { pgTable, varchar, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Analytics Events Table
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  dealId: varchar("deal_id"),
  eventType: text("event_type").notNull(), // 'view', 'join', 'abandon', 'share', 'click'
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  sessionId: varchar("session_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Deal Analytics View (pre-computed stats)
export const dealAnalytics = pgTable("deal_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull().unique(),
  totalViews: integer("total_views").default(0),
  uniqueViews: integer("unique_views").default(0),
  totalJoins: integer("total_joins").default(0),
  conversionRate: integer("conversion_rate").default(0), // percentage * 100
  totalRevenue: integer("total_revenue").default(0), // in agorot
  averageOrderValue: integer("average_order_value").default(0),
  abandonmentRate: integer("abandonment_rate").default(0), // percentage * 100
  shareCount: integer("share_count").default(0),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export type DealAnalytics = typeof dealAnalytics.$inferSelect;
export type InsertDealAnalytics = typeof dealAnalytics.$inferInsert;
