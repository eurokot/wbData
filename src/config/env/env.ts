import dotenv from "dotenv";
import { z } from "zod";
import createLogger from "#libraries/logger.js";
const logger = createLogger("Config");

dotenv.config();

const scheduleSchema = z.record(z.string(), z.string());

const googleApiKeysSchema = z.object({
  type: z.string().optional(),
  project_id: z.string().optional(),
  private_key_id: z.string().optional(),
  private_key: z.string(), // Обязательное поле
  client_email: z.string(), // Обязательное поле
  client_id: z.string().optional(),
  auth_uri: z.string().optional(),
  token_uri: z.string().optional(),
  auth_provider_x509_cert_url: z.string().optional(),
  client_x509_cert_url: z.string().optional(),
  universe_domain: z.string().optional(),
});

const envSchema = z.object({
  NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
  POSTGRES_HOST: z.union([z.undefined(), z.string()]),
  POSTGRES_PORT: z
    .string()
    .regex(/^[0-9]+$/)
    .transform((value) => parseInt(value)),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  APP_PORT: z.union([
    z.undefined(),
    z
      .string()
      .regex(/^[0-9]+$/)
      .transform((value) => parseInt(value)),
  ]),
  WB_API_KEY: z.union([z.undefined(), z.string()]),
  GOOGLE_SHEETS_IDS: z
    .union([z.undefined(), z.string()])
    .transform((value) => {
      if (!value) return [];

      try {
        return value.split(",").map((id) => id.trim());
      } catch (err) {
        logger.warn(err);
        return [];
      }
    })
    .pipe(z.array(z.string())),
  GOOGLE_API_KEYS: z
    .union([z.undefined(), z.string()])
    .transform((value) => {
      if (!value) return undefined;

      try {
        const parsed = JSON.parse(value);
        return googleApiKeysSchema.parse(parsed);
      } catch (err) {
        logger.warn(err);
        return undefined;
      }
    })
    .pipe(z.union([z.undefined(), googleApiKeysSchema])),
  SCHEDULE: z
    .union([z.undefined(), z.string()])
    .transform((value) => {
      if (!value) return {};

      try {
        const parsed = JSON.parse(value);
        return scheduleSchema.parse(parsed);
      } catch (err) {
        logger.warn(err);
        return {};
      }
    })
    .pipe(scheduleSchema),
});

const env = envSchema.parse({
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,
  APP_PORT: process.env.APP_PORT,
  WB_API_KEY: process.env.WB_API_KEY,
  GOOGLE_SHEETS_IDS: process.env.GOOGLE_SHEETS_IDS,
  GOOGLE_API_KEYS: process.env.GOOGLE_API_KEYS,
  SCHEDULE: process.env.SCHEDULE,
});

export default env;
