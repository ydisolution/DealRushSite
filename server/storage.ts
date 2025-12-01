import { 
  type User, 
  type UpsertUser, 
  type Deal, 
  type InsertDeal, 
  type Participant, 
  type InsertParticipant,
  users,
  deals,
  participants 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsByCategory(category: string): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  
  getParticipantsByDeal(dealId: string): Promise<Participant[]>;
  getParticipantsByUser(userId: string): Promise<Participant[]>;
  addParticipant(participant: InsertParticipant): Promise<Participant>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.isActive, "true"));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    const allDeals = await db.select().from(deals).where(eq(deals.category, category));
    return allDeals.filter(d => d.isActive === "true");
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values({
        ...insertDeal,
        description: insertDeal.description ?? null,
        participants: insertDeal.participants ?? 0,
        specs: insertDeal.specs ?? [],
        isActive: insertDeal.isActive ?? "true",
      })
      .returning();
    return deal;
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set(updates)
      .where(eq(deals.id, id))
      .returning();
    return deal;
  }

  async deleteDeal(id: string): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id)).returning();
    return result.length > 0;
  }

  async getParticipantsByDeal(dealId: string): Promise<Participant[]> {
    const result = await db.select().from(participants).where(eq(participants.dealId, dealId));
    return result.sort((a, b) => a.position - b.position);
  }

  async getParticipantsByUser(userId: string): Promise<Participant[]> {
    const result = await db.select().from(participants).where(eq(participants.userId, userId));
    return result;
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const [participant] = await db
      .insert(participants)
      .values(insertParticipant)
      .returning();
    return participant;
  }
}

export class MemStorage implements IStorage {
  private usersMap: Map<string, User>;
  private dealsMap: Map<string, Deal>;
  private participantsMap: Map<string, Participant>;

  constructor() {
    this.usersMap = new Map();
    this.dealsMap = new Map();
    this.participantsMap = new Map();
    this.seedDeals();
    this.seedParticipants();
  }

  private seedDeals() {
    const now = new Date();
    const sampleDeals: Deal[] = [
      {
        id: "1",
        name: "מקרר Samsung 4 דלתות 636 ליטר",
        description: "מקרר משפחתי מתקדם עם טכנולוגיית Twin Cooling Plus",
        category: "electrical",
        images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400"],
        originalPrice: 8500,
        currentPrice: 6800,
        participants: 45,
        targetParticipants: 100,
        endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 30, discount: 15, price: 7225 },
          { minParticipants: 31, maxParticipants: 60, discount: 20, price: 6800 },
          { minParticipants: 61, maxParticipants: 100, discount: 25, price: 6375 },
        ],
        specs: [
          { label: "נפח", value: "636 ליטר" },
          { label: "סוג", value: "4 דלתות" },
          { label: "צבע", value: "נירוסטה" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
      {
        id: "2",
        name: 'טלוויזיה LG OLED 65"',
        description: "טלוויזיה חכמה עם טכנולוגיית OLED מתקדמת",
        category: "electrical",
        images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"],
        originalPrice: 7500,
        currentPrice: 5625,
        participants: 78,
        targetParticipants: 100,
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 40, discount: 20, price: 6000 },
          { minParticipants: 41, maxParticipants: 80, discount: 25, price: 5625 },
          { minParticipants: 81, maxParticipants: 100, discount: 30, price: 5250 },
        ],
        specs: [
          { label: "גודל מסך", value: '65"' },
          { label: "רזולוציה", value: "4K Ultra HD" },
          { label: "טכנולוגיה", value: "OLED" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
      {
        id: "3",
        name: "מזגן עילי Tadiran 1.5 כ\"ס",
        description: "מזגן אינוורטר חסכוני באנרגיה עם שלט חכם",
        category: "electrical",
        images: ["https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=400"],
        originalPrice: 4500,
        currentPrice: 3690,
        participants: 156,
        targetParticipants: 200,
        endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 50, discount: 12, price: 3960 },
          { minParticipants: 51, maxParticipants: 120, discount: 18, price: 3690 },
          { minParticipants: 121, maxParticipants: 200, discount: 25, price: 3375 },
        ],
        specs: [
          { label: "הספק", value: '1.5 כ"ס' },
          { label: "סוג", value: "אינוורטר" },
          { label: "דירוג אנרגטי", value: "A++" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
      {
        id: "4",
        name: "ספה פינתית מודרנית",
        description: "ספה מעוצבת עם בד איכותי ורגלי עץ",
        category: "furniture",
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"],
        originalPrice: 12000,
        currentPrice: 9600,
        participants: 23,
        targetParticipants: 50,
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 20, discount: 15, price: 10200 },
          { minParticipants: 21, maxParticipants: 35, discount: 20, price: 9600 },
          { minParticipants: 36, maxParticipants: 50, discount: 28, price: 8640 },
        ],
        specs: [
          { label: "מידות", value: "280x180 ס\"מ" },
          { label: "חומר", value: "בד איכותי" },
          { label: "צבע", value: "אפור" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
      {
        id: "5",
        name: "דירת 4 חדרים בתל אביב",
        description: "דירה חדשה מקבלן באזור מבוקש",
        category: "apartments",
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
        originalPrice: 2800000,
        currentPrice: 2520000,
        participants: 12,
        targetParticipants: 30,
        endTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 10, discount: 8, price: 2576000 },
          { minParticipants: 11, maxParticipants: 20, discount: 10, price: 2520000 },
          { minParticipants: 21, maxParticipants: 30, discount: 12, price: 2464000 },
        ],
        specs: [
          { label: "חדרים", value: "4" },
          { label: "שטח", value: "120 מ\"ר" },
          { label: "קומה", value: "8" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
      {
        id: "6",
        name: "שולחן אוכל עץ מלא",
        description: "שולחן אוכל מעץ אלון מלא ל-8 סועדים",
        category: "furniture",
        images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400"],
        originalPrice: 8500,
        currentPrice: 6800,
        participants: 34,
        targetParticipants: 60,
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        tiers: [
          { minParticipants: 0, maxParticipants: 25, discount: 15, price: 7225 },
          { minParticipants: 26, maxParticipants: 45, discount: 20, price: 6800 },
          { minParticipants: 46, maxParticipants: 60, discount: 25, price: 6375 },
        ],
        specs: [
          { label: "חומר", value: "עץ אלון" },
          { label: "מידות", value: "200x100 ס\"מ" },
          { label: "מקומות", value: "8" },
        ],
        isActive: "true",
        createdAt: now,
        supplierName: null,
        supplierStripeKey: null,
        supplierBankAccount: null,
        platformCommission: 5,
      },
    ];

    sampleDeals.forEach(deal => {
      this.dealsMap.set(deal.id, deal);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = userData.id ? this.usersMap.get(userData.id) : undefined;
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      isAdmin: userData.isAdmin ?? "false",
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.usersMap.set(user.id, user);
    return user;
  }

  async getDeals(): Promise<Deal[]> {
    return Array.from(this.dealsMap.values()).filter(d => d.isActive === "true");
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    return this.dealsMap.get(id);
  }

  async getDealsByCategory(category: string): Promise<Deal[]> {
    return Array.from(this.dealsMap.values()).filter(
      d => d.category === category && d.isActive === "true"
    );
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const deal: Deal = {
      ...insertDeal,
      id,
      description: insertDeal.description ?? null,
      participants: insertDeal.participants ?? 0,
      specs: insertDeal.specs ?? [],
      isActive: insertDeal.isActive ?? "true",
      createdAt: new Date(),
    };
    this.dealsMap.set(id, deal);
    return deal;
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const existing = this.dealsMap.get(id);
    if (!existing) return undefined;
    
    const updated: Deal = { ...existing, ...updates };
    this.dealsMap.set(id, updated);
    return updated;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.dealsMap.delete(id);
  }

  private seedParticipants() {
    const hebrewNames = [
      "דוד לוי", "שרה כהן", "יוסף ברק", "מרים אברהם", "אלי גולן",
      "רחל מזרחי", "משה פרידמן", "לאה שפירא", "יעקב רוזן", "דינה כץ",
      "אבי נגר", "תמר בן דוד", "עמית שלום", "נועה דהן", "אורי פרץ",
      "מיכל אוזן", "רון שמעון", "איילת גבאי", "גיל חיים", "דנה צור",
      "עידו מלכה", "הילה אסף", "יונתן בר", "שני רביב", "טל אמיר",
      "מאיה סהר", "אריאל נוי", "רותם בלום", "ליאור גל", "נועם אדם",
      "עדי קרן", "יובל ים", "שירה הר", "ניר בן", "קרן טל",
      "אסף רז", "גלית שלו", "עומר פז", "הדר מור", "ליאת נור"
    ];
    
    const now = new Date();
    let participantId = 1;
    
    const dealParticipantCounts: { [key: string]: number } = {
      "1": 45, "2": 78, "3": 156, "4": 23, "5": 12, "6": 34
    };
    
    Object.entries(dealParticipantCounts).forEach(([dealId, count]) => {
      const deal = this.dealsMap.get(dealId);
      if (!deal) return;
      
      for (let i = 0; i < count; i++) {
        const position = i + 1;
        const tierIndex = deal.tiers.findIndex(t => position >= t.minParticipants && position <= t.maxParticipants);
        const tier = deal.tiers[tierIndex] || deal.tiers[0];
        
        const positionInTier = position - tier.minParticipants;
        const tierRange = tier.maxParticipants - tier.minParticipants + 1;
        const positionRatio = positionInTier / tierRange;
        const priceVariance = (positionRatio - 0.5) * 0.05;
        const basePrice = tier.price || deal.originalPrice * (1 - tier.discount / 100);
        const pricePaid = Math.round(basePrice * (1 + priceVariance));
        
        const randomName = hebrewNames[Math.floor(Math.random() * hebrewNames.length)];
        const joinTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        
        const participant: Participant = {
          id: String(participantId++),
          dealId,
          userId: null,
          name: randomName,
          pricePaid,
          position,
          joinedAt: joinTime,
        };
        
        this.participantsMap.set(participant.id, participant);
      }
    });
  }

  async getParticipantsByDeal(dealId: string): Promise<Participant[]> {
    return Array.from(this.participantsMap.values())
      .filter(p => p.dealId === dealId)
      .sort((a, b) => a.position - b.position);
  }

  async getParticipantsByUser(userId: string): Promise<Participant[]> {
    return Array.from(this.participantsMap.values())
      .filter(p => p.userId === userId);
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = {
      ...insertParticipant,
      id,
      userId: insertParticipant.userId ?? null,
      joinedAt: new Date(),
    };
    this.participantsMap.set(id, participant);
    return participant;
  }
}

export const storage = new MemStorage();
