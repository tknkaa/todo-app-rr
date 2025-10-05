import * as s from "drizzle-orm/sqlite-core";

export const users = s.sqliteTable("users", {
  id: s.integer(),
  name: s.text(),
});
