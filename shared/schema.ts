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
  isSupplier: text("is_supplier").default("false"),
  supplierCompanyName: text("supplier_company_name"),
  supplierBankDetails: text("supplier_bank_details"),
  supplierStripeAccountId: text("supplier_stripe_account_id"),
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

export const DealStatus = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  ACTIVE: "active",
  LIVE: "live",
  CLOSED: "closed",
  CANCELLED: "cancelled",
} as const;

export type DealStatusType = typeof DealStatus[keyof typeof DealStatus];

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  originalPrice: integer("original_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  costPrice: integer("cost_price"),
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
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  supplierId: varchar("supplier_id"),
  supplierName: text("supplier_name"),
  supplierStripeKey: text("supplier_stripe_key"),
  supplierBankAccount: text("supplier_bank_account"),
  platformCommission: integer("platform_commission").default(5),
  // Dynamic Pricing Settings
  priceDeltaPercentage: integer("price_delta_percentage").default(4), // הפרש בין ראשון לאחרון (ברירת מחדל 4%)
  enableDynamicPricing: text("enable_dynamic_pricing").default("true"), // האם מחיר דינמי פעיל
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
  pricePaid: integer("price_paid").notNull(), // המחיר שהמשתתף צפוי לשלם (מתעדכן)
  initialPrice: integer("initial_price").notNull(), // המחיר שהוצג במועד ההרשמה
  finalPrice: integer("final_price"), // המחיר הסופי לאחר סגירת הדיל
  position: integer("position").notNull(), // מיקום בתור (1 = ראשון)
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
  // Shipping fields
  needsShipping: boolean("needs_shipping").default(false).notNull(),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingZipCode: text("shipping_zip_code"),
  shippingCost: integer("shipping_cost").default(0).notNull(),
});

// Shipping rates table - managed by suppliers
export const shippingRates = pgTable("shipping_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  city: text("city").notNull(),
  cost: integer("cost").notNull(), // in agorot
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const ShippingStatus = {
  PENDING: "pending",
  PREPARING: "preparing",
  SHIPPED: "shipped",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type ShippingStatusType = typeof ShippingStatus[keyof typeof ShippingStatus];

// Shipment tracking table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  dealId: varchar("deal_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  status: text("status").notNull().default("pending"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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
  needsShipping: z.boolean().default(false),
  shippingAddress: z.string().nullable(),
  shippingCity: z.string().nullable(),
  shippingZipCode: z.string().nullable(),
  shippingCost: z.number().default(0),
});

export type Participant = z.infer<typeof participantSchema>;

export const shippingRateSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  supplierId: z.string(),
  city: z.string(),
  cost: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ShippingRate = z.infer<typeof shippingRateSchema>;

export const shipmentSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  dealId: z.string(),
  supplierId: z.string(),
  status: z.string(),
  trackingNumber: z.string().nullable(),
  shippedAt: z.date().nullable(),
  estimatedDelivery: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Shipment = z.infer<typeof shipmentSchema>;

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

export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;

// Order Status Types
export const OrderStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  NEEDS_COORDINATION: "needs_coordination",
  SCHEDULED: "scheduled",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Order Priority Types
export const OrderPriority = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type OrderPriorityType = typeof OrderPriority[keyof typeof OrderPriority];

// Orders table - per customer fulfillment tracking
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  dealId: varchar("deal_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingZip: text("shipping_zip"),
  notesFromCustomer: text("notes_from_customer"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("normal"),
  supplierNotes: text("supplier_notes"),
  internalNotes: text("internal_notes"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  scheduledDeliveryDate: timestamp("scheduled_delivery_date"),
  outForDeliveryDate: timestamp("out_for_delivery_date"),
  deliveredDate: timestamp("delivered_date"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  shippingMethod: text("shipping_method"),
  coordinationRequired: text("coordination_required").default("false"),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const orderSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  dealId: z.string(),
  supplierId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().nullable(),
  customerPhone: z.string().nullable(),
  shippingAddress: z.string().nullable(),
  shippingCity: z.string().nullable(),
  shippingZip: z.string().nullable(),
  notesFromCustomer: z.string().nullable(),
  status: z.string(),
  priority: z.string().nullable(),
  supplierNotes: z.string().nullable(),
  internalNotes: z.string().nullable(),
  expectedDeliveryDate: z.date().nullable(),
  scheduledDeliveryDate: z.date().nullable(),
  outForDeliveryDate: z.date().nullable(),
  deliveredDate: z.date().nullable(),
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  shippingMethod: z.string().nullable(),
  coordinationRequired: z.string().nullable(),
  lastContactDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Order Activity Log - internal tracking
export const orderActivityLog = pgTable("order_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  activityType: text("activity_type").notNull(), // status_change, note_added, contact_made, etc.
  description: text("description").notNull(),
  performedBy: varchar("performed_by"), // supplier ID who made the action
  metadata: text("metadata"), // JSON for extra data
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const orderActivityLogSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  activityType: z.string(),
  description: z.string(),
  performedBy: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.date(),
});

export type OrderActivityLog = z.infer<typeof orderActivityLogSchema>;

// Fulfillment events - timeline tracking
export const fulfillmentEvents = pgTable("fulfillment_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBySupplierId: varchar("created_by_supplier_id"),
});

export const fulfillmentEventSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: z.string(),
  message: z.string(),
  createdAt: z.date(),
  createdBySupplierId: z.string().nullable(),
});

export type FulfillmentEvent = z.infer<typeof fulfillmentEventSchema>;

export const insertFulfillmentEventSchema = createInsertSchema(fulfillmentEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertFulfillmentEvent = z.infer<typeof insertFulfillmentEventSchema>;

// ==================== REAL ESTATE MODULE ====================

// Developers (Contractors / קבלנים)
export const developers = pgTable("developers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logo: text("logo"),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  userId: varchar("user_id"), // Link to users table for login
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertDeveloperSchema = createInsertSchema(developers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;

// Real Estate Projects
export const realEstateProjects = pgTable("real_estate_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull(),
  region: text("region").notNull(), // צפון/מרכז/דרום
  latitude: text("latitude"),
  longitude: text("longitude"),
  addressText: text("address_text"),
  coverImage: text("cover_image"),
  gallery: text("gallery").array().default(sql`ARRAY[]::text[]`),
  description: text("description"),
  highlights: text("highlights").array().default(sql`ARRAY[]::text[]`),
  propertyTypes: jsonb("property_types").$type<Array<{
    type: string; // "3", "4", "5" (number of rooms)
    count: number; // number of units available
    startingFromPrice: number; // baseline price for this apartment type
  }>>().default([]),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  
  // Capacity Management
  totalCapacity: integer("total_capacity").default(0), // Total apartments in group deal
  waitingListCapacity: integer("waiting_list_capacity").default(0), // 20% of totalCapacity
  currentRegistrantCount: integer("current_registrant_count").default(0),
  currentWaitingListCount: integer("current_waiting_list_count").default(0),
  
  // Stage dates for 4-stage funnel
  earlyRegistrationStart: timestamp("early_registration_start"),
  presentationEventDate: timestamp("presentation_event_date"),
  finalRegistrationStart: timestamp("final_registration_start"),
  finalRegistrationEnd: timestamp("final_registration_end"),
  
  // Current stage: EARLY_REGISTRATION | PRESENTATION | FINAL_REGISTRATION | POST_REGISTRATION
  currentStage: text("current_stage").default("EARLY_REGISTRATION"),
  
  marketPriceBaseline: integer("market_price_baseline").notNull(),
  status: text("status").default("open"), // comingSoon | open | paused | closed
  
  // Admin-only status for under-capacity scenario
  internalStatus: text("internal_status"), // OFFER_UPDATE | null
  updatedOfferDetails: text("updated_offer_details"), // Admin can describe updated terms
  
  legalDisclaimer: text("legal_disclaimer"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const realEstateTierSchema = z.object({
  name: z.string(),
  thresholdRegistrants: z.number().min(1),
  fromPrice: z.number().min(0),
  savings: z.number().min(0),
  savingsPercent: z.number().min(0).max(100),
  benefits: z.array(z.string()),
  isActive: z.boolean().default(true),
});

export type RealEstateTier = z.infer<typeof realEstateTierSchema>;

// Discount Tiers for Projects
export const projectTiers = pgTable("project_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  thresholdRegistrants: integer("threshold_registrants").notNull(),
  fromPrice: integer("from_price").notNull(),
  savings: integer("savings").notNull(),
  savingsPercent: integer("savings_percent").notNull(),
  benefits: text("benefits").array().default(sql`ARRAY[]::text[]`),
  isActive: text("is_active").default("true"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertProjectTierSchema = createInsertSchema(projectTiers).omit({
  id: true,
  createdAt: true,
});

export type ProjectTier = typeof projectTiers.$inferSelect;
export type InsertProjectTier = z.infer<typeof insertProjectTierSchema>;

// Project Registrations (Leads) - Enhanced with full funnel
export const projectRegistrations = pgTable("project_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  developerId: varchar("developer_id").notNull(),
  userId: varchar("user_id"), // if logged in
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  cityPreference: text("city_preference"),
  unitTypeInterests: text("unit_type_interests").array().default(sql`ARRAY[]::text[]`),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  equityEstimate: integer("equity_estimate"), // הון עצמי
  hasMortgagePreApproval: text("has_mortgage_pre_approval").default("false"),
  notes: text("notes"),
  source: text("source"), // UTM or referrer
  
  // Full funnel status
  funnelStatus: text("funnel_status").default("PRE_REGISTERED"), 
  // PRE_REGISTERED | CONFIRMED_PARTICIPANT | WAITING_LIST | 
  // TRANSFERRED_TO_DEVELOPER | IN_LEGAL_PROCESS | SIGNED | DROPPED
  
  // Queue Management (for CONFIRMED_PARTICIPANT and WAITING_LIST)
  queuePosition: integer("queue_position"), // FIFO position
  selectedApartmentType: text("selected_apartment_type"), // "3", "4", "5", "6", "Penthouse"
  
  // Webinar/Event tracking
  webinarInviteSent: text("webinar_invite_sent").default("false"),
  webinarInviteSentAt: timestamp("webinar_invite_sent_at"),
  webinarReminderSent: text("webinar_reminder_sent").default("false"),
  webinarReminderSentAt: timestamp("webinar_reminder_sent_at"),
  
  // Confirmation window
  confirmationWindowNotified: text("confirmation_window_notified").default("false"),
  confirmationWindowNotifiedAt: timestamp("confirmation_window_notified_at"),
  
  // Updated offer approval (for under-capacity scenario)
  updatedOfferApproved: text("updated_offer_approved"), // "true" | "false" | null
  updatedOfferApprovedAt: timestamp("updated_offer_approved_at"),
  
  // Consent tracking
  consentMarketing: text("consent_marketing").default("false"),
  consentDataTransfer: text("consent_data_transfer").default("false"), // for final registration
  
  // Stage completion timestamps
  earlyRegisteredAt: timestamp("early_registered_at"),
  eventRsvpAt: timestamp("event_rsvp_at"),
  eventAttendedAt: timestamp("event_attended_at"),
  finalRegisteredAt: timestamp("final_registered_at"),
  transferredAt: timestamp("transferred_at"),
  signedAt: timestamp("signed_at"),
  droppedAt: timestamp("dropped_at"),
  
  // Admin notes
  adminNotes: text("admin_notes"),
  dropReason: text("drop_reason"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertProjectRegistrationSchema = createInsertSchema(projectRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectRegistration = typeof projectRegistrations.$inferSelect;
export type InsertProjectRegistration = z.infer<typeof insertProjectRegistrationSchema>;

// Project Events (הצגת הפרויקט)
export const projectEvents = pgTable("project_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  eventType: text("event_type").notNull(), // webinar | physical
  eventDate: timestamp("event_date").notNull(),
  eventTime: text("event_time"), // HH:MM format
  location: text("location"), // for physical events
  joinLink: text("join_link"), // for webinars
  description: text("description"),
  speakersDealRush: text("speakers_dealrush"), // Your team member name
  speakersDeveloper: text("speakers_developer"), // Developer representative
  speakersAttorney: text("speakers_attorney").default("עו\"ד ספיר"), // Attorney name
  maxAttendees: integer("max_attendees"),
  currentAttendees: integer("current_attendees").default(0),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertProjectEventSchema = createInsertSchema(projectEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectEvent = typeof projectEvents.$inferSelect;
export type InsertProjectEvent = z.infer<typeof insertProjectEventSchema>;

// AI Conversations Log
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // nullable for anonymous
  sessionId: varchar("session_id"), // for anonymous tracking
  projectId: varchar("project_id"), // context
  pageContext: text("page_context"), // which page they're on
  userQuestion: text("user_question").notNull(),
  aiResponse: text("ai_response").notNull(),
  modelUsed: text("model_used"), // openai | claude | gemini
  tokensUsed: integer("tokens_used"),
  wasHelpful: text("was_helpful"), // yes | no | null (not rated)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;

// FAQ Knowledge Base for AI
export const aiFaqKnowledge = pgTable("ai_faq_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // process | stages | legal | technical
  question: text("question").notNull(), // in Hebrew
  answer: text("answer").notNull(), // in Hebrew
  keywords: text("keywords").array().default(sql`ARRAY[]::text[]`), // for matching
  priority: integer("priority").default(1), // higher = show first
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertAiFaqKnowledgeSchema = createInsertSchema(aiFaqKnowledge).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiFaqKnowledge = typeof aiFaqKnowledge.$inferSelect;
export type InsertAiFaqKnowledge = z.infer<typeof insertAiFaqKnowledgeSchema>;

export const insertRealEstateProjectSchema = createInsertSchema(realEstateProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  gallery: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  propertyTypes: z.array(z.object({
    type: z.string(),
    count: z.number(),
    startingFromPrice: z.number(),
  })).optional(),
});

export type RealEstateProject = typeof realEstateProjects.$inferSelect;
export type InsertRealEstateProject = z.infer<typeof insertRealEstateProjectSchema>;
