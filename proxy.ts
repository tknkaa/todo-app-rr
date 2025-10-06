import { Hono } from "hono";
import { todos } from "./db/schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const app = new Hono();
const route = app.get("/proxy", async (c) => {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle({
    client,
  });
  const result = await db.select().from(todos);
  return c.json(result);
});

export default app;
export type AppType = typeof route;
