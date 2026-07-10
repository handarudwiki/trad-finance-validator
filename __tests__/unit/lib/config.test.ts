import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('lib/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset module cache so config.ts re-runs validation on each import
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw an error when required env vars are missing', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.QDRANT_URL;
    delete process.env.QDRANT_COLLECTION;
    delete process.env.GEMINI_API_KEY;
    delete process.env.STORAGE_PATH;
    delete process.env.SESSION_SECRET;
    delete process.env.NEXT_PUBLIC_APP_URL;

    await expect(async () => {
      await import('@/lib/config');
    }).rejects.toThrow('Missing required environment variables');
  });

  it('should throw when an env var is empty string', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.QDRANT_URL = 'http://localhost:6333';
    process.env.QDRANT_COLLECTION = 'regulatory_knowledge';
    process.env.GEMINI_API_KEY = '';
    process.env.STORAGE_PATH = './uploads';
    process.env.SESSION_SECRET = 'secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    await expect(async () => {
      await import('@/lib/config');
    }).rejects.toThrow('Missing required environment variables');
  });

  it('should export env config when all vars are present', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.QDRANT_URL = 'http://localhost:6333';
    process.env.QDRANT_COLLECTION = 'regulatory_knowledge';
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.STORAGE_PATH = './uploads';
    process.env.SESSION_SECRET = 'secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const { env } = await import('@/lib/config');

    expect(env.DATABASE_URL).toBe('postgresql://localhost/db');
    expect(env.QDRANT_URL).toBe('http://localhost:6333');
    expect(env.QDRANT_COLLECTION).toBe('regulatory_knowledge');
    expect(env.GEMINI_API_KEY).toBe('test-api-key');
    expect(env.STORAGE_PATH).toBe('./uploads');
    expect(env.SESSION_SECRET).toBe('secret');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });
});
