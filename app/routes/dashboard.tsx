import type { Route } from "./+types/dashboard";
import { drizzle } from "drizzle-orm/libsql";
import { todos } from "../../db/schema";
import { createClient } from "@libsql/client/web";

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle({
    client,
  });
  const result = await db.select().from(todos);
  return result;
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const todos = loaderData;
  console.log(todos);
  return (
    <>
      <h1>Dashboard</h1>
    </>
  );
}
