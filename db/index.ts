import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import { env } from "@/lib/env";

import * as schema from "./schema";

const dbClientSingleton = () => {
  const connectionString = env.POSTGRES_URL;

  const pool = new Pool({ connectionString });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
};

declare const globalThis: {
  dbClientGlobal: ReturnType<typeof dbClientSingleton>;
} & typeof global;

const dbClient = globalThis.dbClientGlobal ?? dbClientSingleton();
const db = dbClient.db;
export default db;
export const close = dbClient.close;
export { schema };

if (env.NODE_ENV !== "production") globalThis.dbClientGlobal = dbClient;
