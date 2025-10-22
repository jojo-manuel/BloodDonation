const { z } = require('zod');

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional(),
  MONGO_URI: z.string().min(1,  "mongodb+srv://jojomanuelp2026:zUuZEnV4baqSWUge@cluster0.iqr2jjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0;"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ENCRYPTION_SECRET: isProd
    ? z.string().min(1, "ENCRYPTION_SECRET required")
    : z.string().default("dev-secret-change-me"),
  GMAIL_USER: z.string().optional(),
  GMAIL_PASS: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_CLIENT_ID: z.string().optional(),
  FIREBASE_CLIENT_X509_CERT_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Environment validation failed:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

module.exports = parsed.data;






