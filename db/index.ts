import { drizzle } from "drizzle-orm/libsql";
import { users } from "./schema";

const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});

const result = await db.select().from(users);
console.log(result);
