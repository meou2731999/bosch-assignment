import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { createApp } from "../server/app";
import { createUserStore } from "../server/auth/users";
const dir = mkdtempSync(path.join(tmpdir(), "auth-api-"));
let server: Server;
let base: string;
const password = "initial-password-test";
interface Session {
  cookie: string;
  csrfToken: string;
}
async function start() {
  server = createApp({ dataDir: dir }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
}
const stop = () =>
  new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
function send(
  url: string,
  method = "GET",
  body?: unknown,
  session?: Session,
  headers = {},
) {
  return fetch(base + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-requested-with": "RequestDesk",
      ...(session
        ? { Cookie: session.cookie, "x-csrf-token": session.csrfToken }
        : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function login(email: string, pass = password) {
  const response = await send("/auth/login", "POST", { email, password: pass });
  expect(response.status).toBe(200);
  const body = await response.json();
  const cookie = response.headers.get("set-cookie")!;
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Strict");
  expect(body.user).not.toHaveProperty("passwordHash");
  return { cookie: cookie.split(";")[0], csrfToken: body.csrfToken };
}
let admin: Session;
beforeAll(async () => {
  await createUserStore(dir).create(
    {
      email: "admin@example.test",
      password,
      name: "Admin",
      department: "IT",
      role: "requester",
      isAdmin: true,
    },
    true,
  );
  await start();
  admin = await login("admin@example.test");
});
afterAll(async () => {
  await stop();
  rmSync(dir, { recursive: true, force: true });
});
describe("account API", () => {
  it("rejects impersonation, missing login header, invalid credentials and CSRF", async () => {
    expect(
      (
        await send("/requests", "GET", undefined, undefined, {
          "x-demo-user": "alex",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await send(
          "/auth/login",
          "POST",
          { email: "admin@example.test", password },
          undefined,
          { "x-requested-with": "" },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await send("/auth/login", "POST", {
          email: "admin@example.test",
          password: "wrong",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await send("/auth/logout", "POST", {}, admin, {
          "x-csrf-token": "wrong",
        })
      ).status,
    ).toBe(403);
    expect((await send("/auth/session", "GET", undefined, admin)).status).toBe(
      200,
    );
  });
  it("creates user, forces password change, revokes all sessions, then permits access", async () => {
    const created = await send(
      "/admin/users",
      "POST",
      {
        email: "new@example.test",
        password,
        name: "New",
        department: "IT",
        role: "requester",
      },
      admin,
    );
    expect(created.status).toBe(201);
    const user = await created.json();
    expect(user.mustChangePassword).toBe(true);
    expect(user).not.toHaveProperty("passwordHash");
    const first = await login(user.email);
    const second = await login(user.email);
    expect((await send("/requests", "GET", undefined, first)).status).toBe(403);
    expect(
      (
        await send(
          "/auth/change-password",
          "POST",
          { currentPassword: "wrong", password: "changed-password-test" },
          first,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await send(
          "/auth/change-password",
          "POST",
          { currentPassword: password, password: "changed-password-test" },
          first,
        )
      ).status,
    ).toBe(204);
    for (const session of [first, second])
      expect(
        (await send("/auth/session", "GET", undefined, session)).status,
      ).toBe(401);
    const current = await login(user.email, "changed-password-test");
    expect((await send("/requests", "GET", undefined, current)).status).toBe(
      200,
    );
    expect((await send("/admin/users", "GET", undefined, current)).status).toBe(
      403,
    );
    expect(
      (
        await send(
          `/admin/users/${user.id}/reset-password`,
          "POST",
          { password: "reset-password-test" },
          admin,
        )
      ).status,
    ).toBe(200);
    expect(
      (await send("/auth/session", "GET", undefined, current)).status,
    ).toBe(401);
    const reset = await login(user.email, "reset-password-test");
    expect((await send("/requests", "GET", undefined, reset)).status).toBe(403);
    expect(
      (await send(`/admin/users/${user.id}`, "PATCH", { active: false }, admin))
        .status,
    ).toBe(200);
    expect((await send("/auth/session", "GET", undefined, reset)).status).toBe(
      401,
    );
    expect(
      (
        await send("/auth/login", "POST", {
          email: user.email,
          password: "reset-password-test",
        })
      ).status,
    ).toBe(401);
    expect(
      (await send(`/admin/users/${user.id}`, "PATCH", { active: true }, admin))
        .status,
    ).toBe(200);
    const enabled = await login(user.email, "reset-password-test");
    expect((await send("/auth/logout", "POST", {}, enabled)).status).toBe(204);
    expect(
      (await send("/auth/session", "GET", undefined, enabled)).status,
    ).toBe(401);
  });
  it("protects last admin and invalidates sessions on restart while keeping accounts", async () => {
    const self = await (
      await send("/auth/session", "GET", undefined, admin)
    ).json();
    expect(
      (
        await send(
          `/admin/users/${self.user.id}`,
          "PATCH",
          { active: false },
          admin,
        )
      ).status,
    ).toBe(409);
    await stop();
    await start();
    expect((await send("/auth/session", "GET", undefined, admin)).status).toBe(
      401,
    );
    admin = await login("admin@example.test");
    expect((await send("/admin/users", "GET", undefined, admin)).status).toBe(
      200,
    );
  });
  it("limits repeated failed sign-ins", async () => {
    for (let i = 0; i < 10; i++)
      expect(
        (
          await send("/auth/login", "POST", {
            email: "absent@example.test",
            password,
          })
        ).status,
      ).toBe(401);
    expect(
      (
        await send("/auth/login", "POST", {
          email: "absent@example.test",
          password,
        })
      ).status,
    ).toBe(429);
  });
});
