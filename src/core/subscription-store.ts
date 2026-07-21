import type Database from "better-sqlite3";

export type Tier = "free" | "trial" | "pro" | "premium";

export interface Subscription {
  userId: string;
  channel: string;
  tier: Tier;
  trialStart: number | null;
  trialEnd: number | null;
  expiresAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface DailyUsage {
  userId: string;
  channel: string;
  date: string;
  count: number;
}

export type Feature =
  | "text_chat"
  | "voice_input"
  | "voice_output"
  | "food_analysis"
  | "image_gen"
  | "selfie"
  | "scheduler"
  | "web_search";

const TIER_FEATURES: Record<Tier, Set<Feature>> = {
  free: new Set(["text_chat", "web_search"]),
  trial: new Set(["text_chat", "voice_input", "voice_output", "food_analysis", "image_gen", "scheduler", "web_search"]),
  pro: new Set(["text_chat", "voice_input", "voice_output", "food_analysis", "image_gen", "scheduler", "web_search"]),
  premium: new Set(["text_chat", "voice_input", "voice_output", "food_analysis", "image_gen", "selfie", "scheduler", "web_search"]),
};

const TIER_RESTRICTED_TOOLS: Record<string, Tier> = {
  food_analysis: "trial",
  image_gen: "trial",
  selfie: "premium",
  scheduler: "trial",
};

const DAILY_LIMITS: Record<Tier, number> = {
  free: 20,
  trial: Infinity,
  pro: Infinity,
  premium: Infinity,
};

const TRIAL_DAYS = 1;
const FREE_TIER_DAILY_MSG_LIMIT = 20;

export class SubscriptionStore {
  constructor(private db: Database.Database) {}

  init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT NOT NULL,
        channel TEXT NOT NULL DEFAULT 'telegram',
        tier TEXT NOT NULL DEFAULT 'free',
        trial_start INTEGER,
        trial_end INTEGER,
        expires_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, channel)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_usage (
        user_id TEXT NOT NULL,
        channel TEXT NOT NULL DEFAULT 'telegram',
        date TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, channel, date)
      )
    `);
  }

  getSubscription(userId: string, channel: string = "telegram"): Subscription | null {
    const row = this.db.prepare(
      "SELECT user_id, channel, tier, trial_start, trial_end, expires_at, created_at, updated_at FROM subscriptions WHERE user_id = ? AND channel = ?"
    ).get(userId, channel) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      userId: row.user_id as string,
      channel: row.channel as string,
      tier: this.resolveTier(row as Subscription),
      trialStart: row.trial_start as number | null,
      trialEnd: row.trial_end as number | null,
      expiresAt: row.expires_at as number | null,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  private resolveTier(row: Subscription): Tier {
    if (row.tier === "trial" && row.trialEnd && Date.now() > row.trialEnd) {
      return "free";
    }
    if (row.tier === "pro" && row.expiresAt && Date.now() > row.expiresAt) {
      return "free";
    }
    if (row.tier === "premium" && row.expiresAt && Date.now() > row.expiresAt) {
      return "free";
    }
    return row.tier as Tier;
  }

  getOrCreateSubscription(userId: string, channel: string = "telegram"): Subscription {
    const existing = this.getSubscription(userId, channel);
    if (existing) return existing;

    const now = Date.now();
    const trialEnd = now + TRIAL_DAYS * 24 * 60 * 60 * 1000;

    this.db.prepare(`
      INSERT INTO subscriptions (user_id, channel, tier, trial_start, trial_end, expires_at, created_at, updated_at)
      VALUES (?, ?, 'trial', ?, ?, NULL, ?, ?)
    `).run(userId, channel, now, trialEnd, now, now);

    return {
      userId,
      channel,
      tier: "trial",
      trialStart: now,
      trialEnd,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  setTier(userId: string, tier: Tier, channel: string = "telegram"): void {
    const now = Date.now();
    this.db.prepare(`
      UPDATE subscriptions SET tier = ?, updated_at = ? WHERE user_id = ? AND channel = ?
    `).run(tier, now, userId, channel);
  }

  getDailyUsage(userId: string, date: string, channel: string = "telegram"): number {
    const row = this.db.prepare(
      "SELECT count FROM daily_usage WHERE user_id = ? AND channel = ? AND date = ?"
    ).get(userId, channel, date) as { count: number } | undefined;
    return row?.count ?? 0;
  }

  incrementDailyUsage(userId: string, channel: string = "telegram"): void {
    const today = new Date().toISOString().slice(0, 10);
    this.db.prepare(`
      INSERT INTO daily_usage (user_id, channel, date, count) VALUES (?, ?, ?, 1)
      ON CONFLICT(user_id, channel, date) DO UPDATE SET count = count + 1
    `).run(userId, channel, today);
  }

  isOverDailyLimit(userId: string, channel: string = "telegram"): boolean {
    const sub = this.getSubscription(userId, channel);
    const tier = sub?.tier ?? "free";
    const limit = DAILY_LIMITS[tier];
    if (!isFinite(limit)) return false;
    const today = new Date().toISOString().slice(0, 10);
    const used = this.getDailyUsage(userId, today, channel);
    return used >= limit;
  }

  getFeatures(tier: Tier): Set<Feature> {
    return TIER_FEATURES[tier] ?? TIER_FEATURES.free;
  }

  getToolTier(toolName: string): Tier | null {
    return TIER_RESTRICTED_TOOLS[toolName] ?? null;
  }

  isToolAllowed(toolName: string, tier: Tier): boolean {
    const requiredTier = this.getToolTier(toolName);
    if (!requiredTier) return true;
    const tierOrder: Tier[] = ["free", "trial", "pro", "premium"];
    const userLevel = tierOrder.indexOf(tier);
    const requiredLevel = tierOrder.indexOf(requiredTier);
    return userLevel >= requiredLevel;
  }

  getDailyLimit(tier: Tier): number {
    return DAILY_LIMITS[tier];
  }

  getTrialDays(): number {
    return TRIAL_DAYS;
  }
}
