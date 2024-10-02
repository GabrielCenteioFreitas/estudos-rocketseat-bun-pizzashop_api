import type { Config } from "drizzle-kit"

const config: Config = {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: 'postgresql',
} 

export default config