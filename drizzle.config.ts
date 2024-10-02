import type { Config } from "drizzle-kit"
import { env } from "./src/env"

const config: Config = {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  }
} 

export default config