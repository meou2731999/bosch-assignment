import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFormStore } from "../server/forms/store";
import { createRequestStore } from "../server/storage/requests";
import { createUserStore } from "../server/auth/users";
import { seedRequests } from "../server/seed";
import { canAccessForm, hasFormPermission } from "../shared/forms";
import { canRead } from "../server/requests/service";
import { reviewRequest } from "../server/requests/review";
import { USERS } from "../shared/model";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs: string[] = [];
function temp() {
  const dir = mkdtempSync(path.join(tmpdir(), "form-unit-"));
  dirs.push(dir);
  return dir;
}
afterEach(() =>
  dirs
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);
const draft = {
  revision: 0,
  name: "Travel requests",
  description: "Internal process",
  template: "request-v2",
};
describe("form lifecycle and compatibility", () => {
  it("imports old versions once, publishes snapshots and rejects stale saves/publishes", () => {
    const dir = temp();
    const store = createFormStore(dir, root);
    expect(store.published("request").version).toBe(2);
    expect(store.published("request", 1).definition).toEqual(
      JSON.parse(
        readFileSync(path.join(root, "forms/request.v1.json"), "utf8"),
      ),
    );
    const created = store.create(draft, "admin");
    expect(() => store.published(created.id)).toThrow("Published form version");
    const published = store.publish(created.id, { revision: 1 }, "admin");
    expect(published.versions[0].validationProfile).toBe("request-v2");
    expect(published.activeVersion).toBe(1);
    expect(() => store.publish(created.id, { revision: 1 }, "admin")).toThrow(
      "newer form draft",
    );
    expect(() =>
      store.save(created.id, { ...draft, revision: 1 }, "admin"),
    ).toThrow("newer form draft");
    const saved = store.save(
      created.id,
      { ...draft, revision: 2, name: "Updated travel" },
      "admin",
    );
    expect(store.published(created.id).name).toBe("Travel requests");
    store.publish(created.id, { revision: saved.draft.revision }, "admin");
    const reopened = createFormStore(dir, root);
    expect(reopened.published(created.id).version).toBe(2);
    expect(reopened.published(created.id, 1).name).toBe("Travel requests");
    expect(reopened.get(created.id).audit.map((event) => event.action)).toEqual(
      ["created", "published", "draft_saved", "published"],
    );
    const detached = reopened.get(created.id);
    detached.versions[0].definition.components.length = 0;
    expect(
      reopened.published(created.id, 1).definition.components.length,
    ).toBeGreaterThan(0);
    expect(() =>
      store.create({ ...draft, definition: { components: [] } }, "admin"),
    ).toThrow("Invalid form draft");
  });
  it("migrates old request records with a backup without changing data, attachments, versions or audit", () => {
    const dir = temp();
    const legacy = seedRequests().map(
      ({ formId: _formId, ...record }) => record,
    );
    legacy[0].attachments = [
      { name: "legacy.txt", size: 20, type: "text/plain" },
    ];
    writeFileSync(path.join(dir, "requests.json"), JSON.stringify(legacy));
    const store = createRequestStore(dir);
    expect(store.all()).toEqual(
      legacy.map((record) => ({ ...record, formId: "request" })),
    );
    const backup = readFileSync(
      path.join(dir, "requests.pre-form-id.json"),
      "utf8",
    );
    expect(JSON.parse(backup)).toEqual(legacy);
    expect(createRequestStore(dir).all()).toEqual(store.all());
    expect(
      readFileSync(path.join(dir, "requests.pre-form-id.json"), "utf8"),
    ).toBe(backup);
  });
  it("migrates legacy account grants once and keeps revoked grants revoked after restart", async () => {
    const dir = temp();
    const initial = createUserStore(dir);
    await initial.password("alex", "migration-password", false);
    const original = JSON.parse(
      readFileSync(path.join(dir, "users.json"), "utf8"),
    );
    writeFileSync(
      path.join(dir, "users.json"),
      JSON.stringify(
        original.map((user: Record<string, unknown>) => {
          const rest = { ...user };
          delete rest.formPermissions;
          delete rest.permissionRevision;
          return rest;
        }),
      ),
    );
    const migrated = createUserStore(dir);
    expect(migrated.get("alex").passwordHash).toBe(original[0].passwordHash);
    expect(migrated.get("morgan").formPermissions).toEqual({
      request: ["view", "review"],
    });
    migrated.setPermissions("alex", {}, 0, "admin");
    expect(createUserStore(dir).get("alex").formPermissions).toEqual({});
    expect(() =>
      migrated.setPermissions("alex", { request: ["create"] }, 0, "admin"),
    ).toThrow("permissions changed");
    expect(migrated.get("alex").permissionAudit?.[0].actorId).toBe("admin");
  });
});
describe("form permission policy", () => {
  const own = seedRequests()[0];
  it("denies missing and prototype keys; reviewer grant implies view, role alone grants nothing", () => {
    const noGrants = { ...USERS[2], formPermissions: {} };
    expect(canRead(noGrants, own)).toBe(false);
    expect(canAccessForm(noGrants, "request")).toBe(false);
    expect(hasFormPermission(noGrants, "constructor", "create")).toBe(false);
    const reviewOnly = {
      ...noGrants,
      formPermissions: { request: ["review" as const] },
    };
    expect(canRead(reviewOnly, own)).toBe(true);
    expect(hasFormPermission(reviewOnly, "request", "view")).toBe(true);
  });
  it("admin can read but cannot create/review implicitly, and self review is denied", () => {
    const admin = { ...USERS[0], isAdmin: true, formPermissions: {} };
    expect(canRead(admin, own)).toBe(true);
    expect(hasFormPermission(admin, "request", "create")).toBe(false);
    expect(() =>
      reviewRequest(
        admin,
        own,
        { revision: 1, decision: "approve", comment: "" },
        "now",
      ),
    ).toThrow("Only reviewers");
    expect(() =>
      reviewRequest(
        { ...USERS[0], formPermissions: { request: ["review"] } },
        own,
        { revision: 1, decision: "approve", comment: "" },
        "now",
      ),
    ).toThrow("Only reviewers");
    expect(canRead({ ...USERS[0], formPermissions: {} }, own)).toBe(false);
  });
});
