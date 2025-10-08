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
      "json",
      z.object({
        detail: z.string(),
      }),
    ),
    async (c) => {
      const result = await db.insert(todos).values({
        detail: c.req.valid("json").detail,
        isDone: false,
      });
      console.log(result);
      return c.text("Created", 201);
    },
  )
  .delete(
    "/todos/:id",
    zValidator(
      "param",
      z.object({
        id: z.coerce.number(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      if (!id) {
        return c.text("Invalid ID", 400);
      }
      const result = await db.delete(todos).where(eq(todos.id, id));
      return c.text("Deleted", 200);
    },
  )
  .patch(
    "/todos/:id",
    zValidator(
      "param",
      z.object({
        id: z.coerce.number(),
      }),
    ),
    zValidator(
      "json",
      z.object({
        isDone: z.boolean(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { isDone } = c.req.valid("json");
      const result = await db
        .update(todos)
        .set({ isDone: isDone })
        .where(eq(todos.id, id));
      return c.text("Updated", 200);
    },
  );

export default app;
export type AppType = typeof route;
