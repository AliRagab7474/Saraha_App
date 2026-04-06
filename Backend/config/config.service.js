import { resolve } from "node:path";
import { config } from "dotenv";
export const NODE_ENV = process.env.NODE_ENV || "development";
const envPaths = {
  development: ".env.development",
  production: ".env.production",
};
console.log({ env: envPaths[NODE_ENV] });
config({ path: resolve(`./config/${envPaths[NODE_ENV]}`) });

export const port = process.env.PORT ?? 5000;
export const DB_URI = process.env.DB_URI;
export const DB_NAME = process.env.DB_NAME;
export const Salt_Round = parseInt(process.env.Salt_Round);
export const IV_LENGTH = parseInt(process.env.IV_LENGTH);
export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
export const USER_ACCESS_TOKEN_SECRET_KEY = process.env.USER_ACCESS_TOKEN_SECRET_KEY;
export const USER_REFRESH_TOKEN_SECRET_KEY = process.env.USER_REFRESH_TOKEN_SECRET_KEY;
export const ADMIN_ACCESS_TOKEN_SECRET_KEY = process.env.ADMIN_ACCESS_TOKEN_SECRET_KEY;
export const ADMIN_REFRESH_TOKEN_SECRET_KEY = process.env.ADMIN_REFRESH_TOKEN_SECRET_KEY;
export const REDIS_URI = process.env.REDIS_URI;
export const APP_EMAIL_PASSWORD = process.env.APP_EMAIL_PASSWORD;
export const APP_EMAIL = process.env.APP_EMAIL;
