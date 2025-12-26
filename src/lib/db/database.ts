import Dexie, { Table } from 'dexie';

/**
 * Database schema interfaces
 */

export interface Conversation {
  id?: number;
  title: string;
  folderId?: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id?: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Prompt {
  id?: number;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  folderId?: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface Folder {
  id?: number;
  name: string;
  parentId?: number;
  type: 'conversation' | 'prompt';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: unknown;
  updatedAt: Date;
}

/**
 * BetterGPT Database Class
 *
 * This class manages all local storage using DexieJS (IndexedDB wrapper)
 */
export class BetterGPTDatabase extends Dexie {
  conversations!: Table<Conversation, number>;
  messages!: Table<Message, number>;
  prompts!: Table<Prompt, number>;
  folders!: Table<Folder, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('BetterGPTDB');

    // Define database schema
    this.version(1).stores({
      conversations: '++id, folderId, createdAt, updatedAt, lastMessageAt',
      messages: '++id, conversationId, timestamp',
      prompts: '++id, folderId, category, isFavorite, createdAt, updatedAt, usageCount',
      folders: '++id, parentId, type, order',
      settings: '++id, &key, updatedAt',
    });
  }

  /**
   * Initialize database with default data
   */
  async initializeDefaults(): Promise<void> {
    // Check if already initialized
    const settingsCount = await this.settings.count();
    if (settingsCount > 0) {
      return;
    }

    // Add default settings
    await this.settings.bulkAdd([
      {
        key: 'initialized',
        value: true,
        updatedAt: new Date(),
      },
      {
        key: 'theme',
        value: 'light',
        updatedAt: new Date(),
      },
      {
        key: 'version',
        value: '0.1.0',
        updatedAt: new Date(),
      },
    ]);

    // Add default prompt examples
    await this.prompts.bulkAdd([
      {
        title: 'Summarize Text',
        content: 'Please summarize the following text in a concise manner:\n\n[TEXT]',
        category: 'writing',
        tags: ['summarize', 'writing'],
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
      {
        title: "Explain Like I'm 5",
        content:
          'Please explain the following concept in simple terms that a 5-year-old would understand:\n\n[CONCEPT]',
        category: 'education',
        tags: ['explain', 'education'],
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
      {
        title: 'Code Review',
        content:
          'Please review the following code and provide suggestions for improvement:\n\n```\n[CODE]\n```',
        category: 'coding',
        tags: ['code', 'review'],
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
    ]);

    console.log('[Database] Default data initialized');
  }

  /**
   * Get a setting value by key
   */
  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    const setting = await this.settings.where('key').equals(key).first();
    return setting?.value as T | undefined;
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: unknown): Promise<void> {
    const existing = await this.settings.where('key').equals(key).first();

    if (existing) {
      await this.settings.update(existing.id!, {
        value,
        updatedAt: new Date(),
      });
    } else {
      await this.settings.add({
        key,
        value,
        updatedAt: new Date(),
      });
    }
  }
}

// Create and export database instance
export const db = new BetterGPTDatabase();

// Initialize defaults when database is opened
db.on('ready', async () => {
  await db.initializeDefaults();
});
