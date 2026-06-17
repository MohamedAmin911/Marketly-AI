import { z } from "zod";

const envSchema = z.object({
  AI_PROVIDER: z.enum(["openai", "huggingface"]).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default("dev-access-secret-change-me-32-bytes"),
  JWT_REFRESH_SECRET: z.string().min(32).default("dev-refresh-secret-change-me-32-byte"),
  MONGODB_URI: z.string().trim().regex(/^mongodb(?:\+srv)?:\/\//, "MONGODB_URI must be a MongoDB connection string.").optional(),
  N8N_GROWTH_ENGINE_WEBHOOK_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
