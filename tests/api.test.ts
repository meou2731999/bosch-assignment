import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { createUserStore } from "../server/auth/users";
import { createApp } from "../server/app";
import type { Attachment } from "../shared/model";
import { MAX_FILE_BYTES } from "../shared/attachments";
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
      formVersion: 1,
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
describe("attachment API and persisted decisions", () => {
  it("uploads bytes, scopes pending previews, saves trusted metadata and survives server restart", async () => {
    const id = randomUUID();
    const file = await fileFor(id);
    expect(await (await send(`/attachments/${file.id}`)).text()).toBe(
      "Synthetic request attachment.",
    );
    expect((await send(`/attachments/${file.id}`, "morgan")).status).toBe(404);
    const saved = await write(id, [
      { ...file, name: "spoofed.pdf", size: 1, type: "application/pdf" },
    ]);
    expect(saved.status).toBe(201);
    expect((await saved.json()).attachments[0]).toEqual(file);
    await stop();
    await start();
    const reopened = await send(`/attachments/${file.id}`, "morgan");
    expect(reopened.status).toBe(200);
    expect(reopened.headers.get("content-type")).toContain("text/plain");
    expect(reopened.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await reopened.text()).toBe("Synthetic request attachment.");
    expect((await send(`/attachments/${file.id}`, "sam")).status).toBe(404);
  });
  it("blocks uploads by reviewers or another owner and prevents reusing an upload on another request", async () => {
    const id = randomUUID();
    const file = await fileFor(id);
    await write(id, [file]);
    expect((await upload(id, "notes.txt", "text", "sam")).status).toBe(403);
    expect(
      (await upload(randomUUID(), "notes.txt", "text", "morgan")).status,
    ).toBe(403);
    expect((await write(randomUUID(), [file])).status).toBe(403);
    expect((await write(id, [file], { revision: 1 }, "sam")).status).toBe(403);
  });
  it("rejects invalid content, empty files, oversized uploads and missing identity", async () => {
    expect(
      (await upload(randomUUID(), "fake.pdf", "<script>alert(1)</script>"))
        .status,
    ).toBe(422);
    expect((await upload(randomUUID(), "page.html", "hello")).status).toBe(422);
    expect((await upload(randomUUID(), "notes.txt", "")).status).toBe(422);
    expect(
      (
        await upload(
          randomUUID(),
          "notes.txt",
          new Uint8Array(MAX_FILE_BYTES + 1).fill(65),
        )
      ).status,
    ).toBe(413);
    expect((await upload(randomUUID(), "notes.txt", "text", "")).status).toBe(
      401,
    );
  });
  it("rejects duplicate references, invented metadata and more than three linked files", async () => {
    const id = randomUUID();
    const files = [];
    for (let i = 0; i < 4; i++) files.push(await fileFor(id));
    expect((await write(id, files)).status).toBe(422);
    expect((await write(id, [files[0], files[0]])).status).toBe(422);
    expect(
      (await write(id, [{ name: "missing.txt", size: 5, type: "text/plain" }]))
        .status,
    ).toBe(422);
    expect((await send("/attachments/not-an-id")).status).toBe(404);
  });
  it("serves valid PNG and PDF uploads with their detected content types", async () => {
    const cases: [string, Uint8Array, string][] = [
      [
        "pixel.png",
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
          "base64",
        ),
        "image/png",
      ],
      [
        "sample.pdf",
        Buffer.from(
          "%PDF-1.4\n% Minimal signature fixture; not a rendering test.\n",
        ),
        "application/pdf",
      ],
    ];
    for (const [name, bytes, type] of cases) {
      const response = await upload(randomUUID(), name, bytes);
      expect(response.status).toBe(201);
      const file = await response.json();
      expect(file.type).toBe(type);
      expect(
        Buffer.from(
          await (await send(`/attachments/${file.id}`)).arrayBuffer(),
        ),
      ).toEqual(Buffer.from(bytes));
    }
  });
  it("persists a rejection and comment, rejects repeat decisions, and keeps attachments accessible", async () => {
    const id = randomUUID();
    const file = await fileFor(id);
    const created = await write(id, [file], {
      action: "submit",
      data: {
        requestTitle: "Software for reporting",
        requestType: "software",
        application: "analytics",
        accessDays: 30,
        reason: "Required for the quarterly report.",
      },
    });
    expect(created.status).toBe(201);
    expect((await upload(id)).status).toBe(409);
    const decide = (user: string, comment: string, revision = 1) =>
      send(`/requests/${id}/review`, user, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision, decision: "reject", comment }),
      });
    expect((await decide("alex", "No")).status).toBe(403);
    expect((await decide("morgan", " ")).status).toBe(422);
    const decision = await decide(
      "morgan",
      "Please explain the business need.",
    );
    expect(decision.status).toBe(200);
    const reviewed = await decision.json();
    expect(reviewed.status).toBe("rejected");
    expect(reviewed.audit.at(-1).comment).toBe(
      "Please explain the business need.",
    );
    expect((await decide("morgan", "Again", 1)).status).toBe(409);
    expect((await decide("morgan", "Again", 2)).status).toBe(409);
    const loaded = await (await send(`/requests/${id}`)).json();
    expect(loaded).toEqual(reviewed);
    expect((await send(`/attachments/${file.id}`, "morgan")).status).toBe(200);
  });
});
