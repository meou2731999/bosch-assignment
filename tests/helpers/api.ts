import { afterAll, beforeAll, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { createUserStore } from "../../server/auth/users";
import { createApp } from "../../server/app";
import type { Attachment } from "../../shared/model";
export function attachmentFixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "request-desk-test-"));
  let server: Server;
  let base: string;
  const credentials = new Map<string, { cookie: string; csrfToken: string }>();
  const password = "attachment-test-password";
  async function seedAccounts() {
    const users = createUserStore(dir);
    for (const user of users.all()) {
      await users.password(user.id, password, false);
      users.setActive(user.id, true);
    }
  }
  async function start() {
    server = createApp({ dataDir: dir }).listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
    for (const id of ["alex", "sam", "morgan"]) {
      const response = await fetch(base + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "RequestDesk",
        },
        body: JSON.stringify({ email: `${id}@example.test`, password }),
      });
      credentials.set(id, {
        cookie: response.headers.get("set-cookie")!.split(";")[0],
        csrfToken: (await response.json()).csrfToken,
      });
    }
  }
  async function stop() {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  beforeAll(async () => {
    await seedAccounts();
    await start();
  });
  afterAll(async () => {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  });
  const send = (url: string, user = "alex", init?: RequestInit) =>
    fetch(base + url, {
      ...init,
      headers: {
        ...(credentials.has(user)
          ? {
              Cookie: credentials.get(user)!.cookie,
              "x-csrf-token": credentials.get(user)!.csrfToken,
            }
          : {}),
        ...init?.headers,
      },
    });
  const upload = (
    id: string,
    name = "notes.txt",
    content: string | Uint8Array = "Synthetic request attachment.",
    user = "alex",
  ) =>
    send(`/requests/${id}/attachments`, user, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-form-id": "request",
        "x-file-name": encodeURIComponent(name),
      },
      body: content as BodyInit,
    });
  const write = (
    id: string,
    attachments: Attachment[] = [],
    patch = {},
    user = "alex",
  ) =>
    send(`/requests/${id}`, user, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revision: 0,
        formId: "request",
        formVersion: 2,
        action: "draft",
        data: {},
        attachments,
        ...patch,
      }),
    });
  async function fileFor(id: string) {
    const r = await upload(id);
    expect(r.status).toBe(201);
    return r.json() as Promise<Attachment>;
  }
  return { send, upload, write, fileFor, start, stop };
}
