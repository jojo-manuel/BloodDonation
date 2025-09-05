const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().optional(),
  MONGO_URI: z.string().min(1, "MONGO_URI required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Environment validation failed:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

module.exports = parsed.data;






