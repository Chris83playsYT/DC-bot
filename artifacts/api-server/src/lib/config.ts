const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const config = {
  port: Number(required("PORT")),
  nodeEnv: optional("NODE_ENV", "development"),
  sessionSecret: optional("SESSION_SECRET", "change-me-in-production"),
} as const;

export type Config = typeof config;
