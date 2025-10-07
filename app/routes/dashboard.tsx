import type { Route } from "./+types/dashboard";
import { drizzle } from "drizzle-orm/libsql";
import { todos } from "../../db/schema";
import { createClient } from "@libsql/client/web";
import type { AppType } from "../../proxy.ts";
import { hc } from "hono/client";
import { Form } from "react-router";

export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  if (env.NODE_ENV == "development") {
    const proxy = hc<AppType>("http://localhost:3000/");
    const result = await proxy.todos.$get();
    const todos = await result.json();
    return todos;
  }
  const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle({
    client,
  });
  const result = await db.select().from(todos);
  return result.map((todo) => ({
    ...todo,
    createdAt: todo.createdAt.toISOString(),
  }));
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.cloudflare;

  const formData = await request.formData();
  const detail = formData.get("detail") as string;

  if (env.NODE_ENV == "development") {
    const proxy = hc<AppType>("http://localhost:3000/");
    const _res = await proxy.todos.$post({
      form: {
        detail: detail,
      },
    });
    return;
  }
  const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle({
    client,
  });
  const _res = await db.insert(todos).values({
    detail: detail,
    isDone: false,
  });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const todos = loaderData;
  return (
    <>
      {todos.map((todo) => (
        <div key={todo.id}>
          {todo.detail}:{todo.isDone ? "Completed" : "Pending"} created at{" "}
          {todo.createdAt}
        </div>
      ))}
      <Form method="post">
        <input type="text" name="detail" />
        <button type="submit">submit</button>
      </Form>
    </>
  );
}
