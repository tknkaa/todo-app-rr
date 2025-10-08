import type { Route } from "./+types/dashboard";
import { drizzle } from "drizzle-orm/libsql";
import { todos } from "../../db/schema";
import { createClient } from "@libsql/client/web";
import type { AppType } from "../../proxy.ts";
import { hc } from "hono/client";
import { Form } from "react-router";
import { useState } from "react";
import { eq } from "drizzle-orm";
import { UNSAFE_getTurboStreamSingleFetchDataStrategy } from "react-router";

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
  const deleteId = formData.get("delete-id") as string;
  const patchId = formData.get("patch-id") as string;

  if (env.NODE_ENV == "development") {
    const proxy = hc<AppType>("http://localhost:3000/");
    if (method === "delete") {
      const _res = await proxy.todos[":id"].$delete({
        param: {
          id: deleteId,
        },
      });
    } else if (method === "post") {
      const _res = await proxy.todos.$post({
        json: {
          detail: detail,
        },
      });
    } else if (method === "patch") {
      const _res = await proxy.todos[":id"].$patch({
        param: {
          id: patchId,
        },
        json: {
          isDone: true,
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
    const _res = await db.delete(todos).where(eq(todos.id, Number(deleteId)));
  } else if (method === "post") {
    const _res = await db.insert(todos).values({
      detail: detail,
      isDone: false,
    });
  } else if (method === "patch") {
    const _res = await db
      .update(todos)
      .set({
        isDone: true,
      })
      .where(eq(todos.id, Number(patchId)));
  } else {
    console.error("no method specified");
  }
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const [detail, setDetail] = useState("");
  const todos = loaderData;
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>detail</th>
            <th>created at</th>
            <th>status</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo) => (
            <tr key={todo.id} className="list-row">
              <td>{todo.detail}</td>
              <td>{new Date(todo.createdAt).toDateString()}</td>
              {!todo.isDone ? (
                <>
                  <td>Pending</td>
                  <td>
                    <Form method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="_method" value="patch" />
                      <input type="hidden" name="patch-id" value={todo.id} />
                      <button type="submit" className="btn">
                        mark as Completed
                      </button>
                    </Form>
                  </td>
                </>
              ) : (
                <>
                  <td>Completed</td>
                  <td>
                    <Form method="post">
                      <input type="hidden" name="_method" value="delete" />
                      <input type="hidden" name="delete-id" value={todo.id} />
                      <button type="submit" className="btn">
                        delete
                      </button>
                    </Form>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <Form method="post" onSubmit={() => setDetail("")} className="flex gap-2">
        <input type="hidden" name="_method" value="post" />
        <input
          type="text"
          name="detail"
          className="input"
          placeholder="create new Todo"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <button type="submit" className="btn">
          submit
        </button>
      </Form>
    </>
  );
}
