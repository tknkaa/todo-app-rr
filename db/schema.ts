import * as s from "drizzle-orm/sqlite-core";

export const todos = s.sqliteTable("todos", {
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  isDone: s.integer("is_done", { mode: "boolean" }).notNull(),
  detail: s.text("detail").notNull(),
  createdAt: s
    .integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
});
