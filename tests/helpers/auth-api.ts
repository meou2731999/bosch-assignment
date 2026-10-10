import { afterAll, beforeAll, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { createApp } from "../../server/app";
import { createUserStore } from "../../server/auth/users";
export function authFixture() {
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
    const response = await send("/auth/login", "POST", {
      email,
      password: pass,
    });
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
  return {
    send,
    login,
    start,
    stop,
    password,
    get admin() {
      return admin;
    },
    set admin(value: Session) {
      admin = value;
    },
  };
}
