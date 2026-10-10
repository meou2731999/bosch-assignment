import { afterAll, beforeAll, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { createApp } from "../../server/app";
import { createUserStore } from "../../server/auth/users";
import type { FormRecord, FormPermissions } from "../../shared/forms";
export function formsFixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "forms-api-"));
  let server: Server;
  let base: string;
  const password = "forms-api-password";
  interface Session {
    cookie: string;
    csrfToken: string;
  }
  const sessions = new Map<string, Session>();
  async function start() {
    server = createApp({ dataDir: dir }).listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
    for (const id of ["alex", "sam", "morgan", "admin"]) await login(id);
  }
  const stop = () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  function send(
    url: string,
    user = "admin",
    method = "GET",
    body?: unknown,
    extra = {},
  ) {
    const session = sessions.get(user);
    return fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-requested-with": "RequestDesk",
        ...(session
          ? { Cookie: session.cookie, "x-csrf-token": session.csrfToken }
          : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  async function login(id: string) {
    const response = await send("/auth/login", "anonymous", "POST", {
      email: `${id}@example.test`,
      password,
    });
    expect(response.status).toBe(200);
    sessions.set(id, {
      cookie: response.headers.get("set-cookie")!.split(";")[0],
      csrfToken: (await response.json()).csrfToken,
    });
  }
  async function createForm(name = "Scoped requests", publish = true) {
    const response = await send("/admin/forms", "admin", "POST", {
      revision: 0,
      name,
      description: "Test",
      template: "request-v2",
    });
    expect(response.status).toBe(201);
    const form: FormRecord = await response.json();
    if (!publish) return form;
    const published = await send(
      `/admin/forms/${form.id}/publish`,
      "admin",
      "POST",
      { revision: form.draft.revision },
    );
    expect(published.status).toBe(200);
    return published.json() as Promise<FormRecord>;
  }
  async function grant(user: string, permissions: FormPermissions) {
    const list = await (await send("/admin/users")).json();
    const account = list.find(
      (item: { email: string }) => item.email === `${user}@example.test`,
    );
    const response = await send(
      `/admin/users/${account.id}/form-permissions`,
      "admin",
      "PUT",
      { revision: account.permissionRevision, formPermissions: permissions },
    );
    expect(response.status).toBe(200);
    await login(user);
  }
  function input(formId: string, patch = {}) {
    return {
      formId,
      formVersion: 1,
      revision: 0,
      action: "draft",
      data: {},
      attachments: [],
      ...patch,
    };
  }
  const data = {
    requestTitle: "Scoped equipment request",
    requestType: "equipment",
    equipment: "monitor",
    quantity: 1,
    reason: "Needed to prepare quarterly reports.",
    additionalNotes: "Version-independent template data",
  };
  async function upload(id: string, formId: string, user = "alex") {
    const session = sessions.get(user)!;
    return fetch(`${base}/requests/${id}/attachments`, {
      method: "POST",
      headers: {
        Cookie: session.cookie,
        "x-csrf-token": session.csrfToken,
        "Content-Type": "application/octet-stream",
        "x-file-name": "notes.txt",
        "x-form-id": formId,
      },
      body: "scoped attachment",
    });
  }
  beforeAll(async () => {
    const users = createUserStore(dir);
    for (const user of users.all()) {
      await users.password(user.id, password, false);
      users.setActive(user.id, true);
    }
    await users.create(
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
  });
  afterAll(async () => {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    dir,
    send,
    login,
    createForm,
    grant,
    input,
    data,
    upload,
    start,
    stop,
    sessions,
    get base() {
      return base;
    },
  };
}
