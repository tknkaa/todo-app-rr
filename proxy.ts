import { Hono } from "hono";
import { todos } from "./db/schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";

const app = new Hono();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle({
  client,
});

const route = app
  .get("/todos", async (c) => {
    const result = await db.select().from(todos);
    return c.json(result);
  })
  .post(
    "/todos",
    zValidator(
      "form",
      z.object({
        detail: z.string(),
      }),
    ),
    async (c) => {
      const result = await db.insert(todos).values({
        detail: c.req.valid("form").detail,
        isDone: false,
      });
      console.log(result);
      return c.text("Created", 201);
    },
  )
  .delete("/todos/:id", async (c) => {
    const id = c.req.param("id");
    console.log(id);
    if (!id) {
      return c.text("Invalid ID", 400);
    }
    const result = await db.delete(todos).where(eq(todos.id, Number(id)));
    return c.text("Deleted", 200);
  });

export default app;
export type AppType = typeof route;
