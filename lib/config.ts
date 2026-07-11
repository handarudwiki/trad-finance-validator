/**
 * Environment configuration validation.
 * Validates all required env vars at startup and throws if any are missing.
 * Satisfies: Requirement 15 (config validation at startup)
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'QDRANT_URL',
  'QDRANT_API_KEY',
  'QDRANT_COLLECTION',
  'GEMINI_API_KEY',
  'STORAGE_PATH',
  'SESSION_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

type EnvVarName = (typeof requiredEnvVars)[number];

type EnvConfig = Record<EnvVarName, string>;

function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const config: Partial<EnvConfig> = {};

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missing.push(envVar);
    } else {
      config[envVar] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nPlease add them to your .env.local file.`
    );
  }

  return config as EnvConfig;
}

export const env = validateEnv();
