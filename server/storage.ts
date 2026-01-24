import { 
  users, type User, type InsertUser,
  distributions, type Distribution, type InsertDistribution,
  holderSnapshots, type HolderSnapshot, type InsertHolderSnapshot,
  protocolConfig, type ProtocolConfig, type InsertProtocolConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDistributions(limit?: number): Promise<Distribution[]>;
  getDistribution(id: string): Promise<Distribution | undefined>;
  createDistribution(distribution: InsertDistribution): Promise<Distribution>;
  updateDistribution(id: string, updates: Partial<Distribution>): Promise<Distribution | undefined>;
  
  getHolderSnapshots(distributionId: string): Promise<HolderSnapshot[]>;
  createHolderSnapshot(snapshot: InsertHolderSnapshot): Promise<HolderSnapshot>;
  updateHolderSnapshot(id: string, updates: Partial<HolderSnapshot>): Promise<HolderSnapshot | undefined>;
  createHolderSnapshots(snapshots: InsertHolderSnapshot[]): Promise<HolderSnapshot[]>;
  
  getProtocolConfig(): Promise<ProtocolConfig | undefined>;
  updateProtocolConfig(config: Partial<ProtocolConfig>): Promise<ProtocolConfig>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDistributions(limit: number = 50): Promise<Distribution[]> {
    return await db.select().from(distributions).orderBy(desc(distributions.timestamp)).limit(limit);
  }

  async getDistribution(id: string): Promise<Distribution | undefined> {
    const [distribution] = await db.select().from(distributions).where(eq(distributions.id, id));
    return distribution || undefined;
  }

  async createDistribution(distribution: InsertDistribution): Promise<Distribution> {
    const [newDistribution] = await db.insert(distributions).values(distribution).returning();
    return newDistribution;
  }

  async updateDistribution(id: string, updates: Partial<Distribution>): Promise<Distribution | undefined> {
    const [updated] = await db.update(distributions).set(updates).where(eq(distributions.id, id)).returning();
    return updated || undefined;
  }

  async getHolderSnapshots(distributionId: string): Promise<HolderSnapshot[]> {
    return await db.select().from(holderSnapshots).where(eq(holderSnapshots.distributionId, distributionId));
  }

  async createHolderSnapshot(snapshot: InsertHolderSnapshot): Promise<HolderSnapshot> {
    const [newSnapshot] = await db.insert(holderSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  async updateHolderSnapshot(id: string, updates: Partial<HolderSnapshot>): Promise<HolderSnapshot | undefined> {
    const [updated] = await db.update(holderSnapshots).set(updates).where(eq(holderSnapshots.id, id)).returning();
    return updated || undefined;
  }

  async createHolderSnapshots(snapshots: InsertHolderSnapshot[]): Promise<HolderSnapshot[]> {
    if (snapshots.length === 0) return [];
    return await db.insert(holderSnapshots).values(snapshots).returning();
  }

  async getProtocolConfig(): Promise<ProtocolConfig | undefined> {
    const [config] = await db.select().from(protocolConfig).where(eq(protocolConfig.id, "config"));
    return config || undefined;
  }

  async updateProtocolConfig(config: Partial<ProtocolConfig>): Promise<ProtocolConfig> {
    const existing = await this.getProtocolConfig();
    if (existing) {
      const [updated] = await db.update(protocolConfig).set(config).where(eq(protocolConfig.id, "config")).returning();
      return updated;
    } else {
      const [created] = await db.insert(protocolConfig).values({ ...config, id: "config" }).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
