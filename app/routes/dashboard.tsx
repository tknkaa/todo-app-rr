import type { Route } from "./+types/dashboard";
import { drizzle } from "drizzle-orm/libsql";
import { todos } from "../../db/schema";
import { createClient } from "@libsql/client/web";
import type { AppType } from "../../proxy.ts";
import { hc } from "hono/client";
import { Form } from "react-router";
import { useState } from "react";
import { eq } from "drizzle-orm";

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
  const method = formData.get("_method") as string;
  const detail = formData.get("detail") as string;
  const id = formData.get("id") as string;
  console.log(method);

  if (env.NODE_ENV == "development") {
    const proxy = hc<AppType>("http://localhost:3000/");
    if (method === "delete") {
      const _res = await proxy.todos[":id"].$delete({
        param: {
          id: id,
        },
      });
    } else if (method === "post") {
      const _res = await proxy.todos.$post({
        form: {
          detail: detail,
        },
      });
    } else {
      console.error("no method specified");
    }
    return;
  }
  const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle({
    client,
  });
  if (method === "delete") {
    const _res = await db.delete(todos).where(eq(todos.id, Number(id)));
  } else if (method === "post") {
    const _res = await db.insert(todos).values({
      detail: detail,
      isDone: false,
    });
  } else {
    console.error("no method specified");
  }
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const [detail, setDetail] = useState("");
  const todos = loaderData;
  return (
    <>
      {todos.map((todo) => (
        <div key={todo.id}>
          {todo.detail}:{todo.isDone ? "Completed" : "Pending"} created at{" "}
          {todo.createdAt}
          <Form method="post" style={{ display: "inline" }}>
            <input type="hidden" name="_method" value="delete" />
            <input type="hidden" name="id" value={todo.id} />
            <button type="submit">delete</button>
          </Form>
        </div>
      ))}
      <Form method="post" onSubmit={() => setDetail("")}>
        <input type="hidden" name="_method" value="post" />
        <input
          type="text"
          name="detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <button type="submit">submit</button>
      </Form>
    </>
  );
}
