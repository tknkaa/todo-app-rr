import type { Route } from "./+types/dashboard";
import { drizzle } from "drizzle-orm/libsql";
import { todos } from "../../db/schema";
import { createClient } from "@libsql/client/web";
import type { AppType } from "../../proxy.ts";
import { hc } from "hono/client";

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  if (env.NODE_ENV == "development") {
    const client = hc<AppType>("http://localhost:3000/");
    const result = await client.proxy.$get();
    return result;
  }
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
  return (
    <>
      {todos.map((todo) => (
        <div key={todo.id}>
          {todo.detail}:{todo.isDone ? "Completed" : "Pending"} created at{" "}
          {todo.createdAt.toLocaleString()}
        </div>
      ))}
    </>
  );
}
