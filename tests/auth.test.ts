import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createUserStore } from "../server/auth/users";
import { hashPassword, verifyPassword } from "../server/auth/password";
import { createSessionStore, SESSION_MS } from "../server/auth/sessions";
const dirs: string[] = [];
const temp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "auth-unit-"));
  dirs.push(dir);
  return dir;
};
afterEach(() =>
  dirs
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);
const account = {
  email: "ADMIN@example.test",
  password: "unit-password-long",
  name: "Admin",
  department: "IT",
  role: "requester",
  isAdmin: true,
};
describe("authentication primitives", () => {
  it("salts hashes and rejects wrong passwords and password bounds", async () => {
    const hash = await hashPassword(account.password);
    expect(hash).not.toBe(await hashPassword(account.password));
    expect(await verifyPassword(account.password, hash)).toBe(true);
    expect(await verifyPassword("incorrect", hash)).toBe(false);
    await expect(hashPassword("short")).rejects.toMatchObject({
      code: "PASSWORD",
    });
    await expect(hashPassword("a".repeat(257))).rejects.toMatchObject({
      code: "PASSWORD",
    });
  });
  it("persists accounts without plaintext and prevents duplicate/bootstrap races", async () => {
    const dir = temp();
    const store = createUserStore(dir);
    const outcomes = await Promise.allSettled([
      store.create(account, true),
      store.create(account, true),
    ]);
    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    const user = store.byEmail(account.email)!;
    expect(createUserStore(dir).get(user.id).email).toBe("admin@example.test");
    expect(readFileSync(path.join(dir, "users.json"), "utf8")).not.toContain(
      account.password,
    );
    expect(store.all().find((item) => item.id === user.id)).not.toHaveProperty(
      "passwordHash",
    );
    expect(() => store.setActive(user.id, false)).toThrow(
      "at least one active administrator",
    );
    await expect(store.create(account)).rejects.toMatchObject({
      code: "EMAIL_EXISTS",
    });
    await expect(
      store.password(user.id, "new-unit-password", false, 0),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("validates edits, keeps admin flags on partial updates and rejects last-admin demotion", async () => {
    const dir = temp();
    const store = createUserStore(dir);
    const admin = await store.create(account, true);
    expect(store.edit(admin.id, { name: "Renamed admin" }).isAdmin).toBe(true);
    expect(() => store.edit(admin.id, { isAdmin: false })).toThrow(
      "at least one active administrator",
    );
    expect(() => store.edit(admin.id, { email: "alex@example.test" })).toThrow(
      "Email already exists",
    );
    expect(() => store.edit(admin.id, { passwordHash: "spoofed" })).toThrow(
      "Invalid account changes",
    );
    expect(() => store.edit("alex", { active: true })).toThrow(
      "Set a password",
    );
    const updated = store.edit(admin.id, {
      email: "NEW@example.test",
      role: "reviewer",
    });
    expect(updated.email).toBe("new@example.test");
    expect(updated.credentialVersion).toBe(admin.credentialVersion + 2);
    expect(createUserStore(dir).get(admin.id).role).toBe("reviewer");
  });
  it("expires sessions, revokes every session for one user, and removes logout tokens", () => {
    let now = 0;
    const store = createSessionStore(() => now);
    const first = store.create("a", 1);
    const second = store.create("a", 1);
    const other = store.create("b", 1);
    store.revoke("a");
    expect(store.get(first.token)).toBeUndefined();
    expect(store.get(second.token)).toBeUndefined();
    expect(store.get(other.token)).toBeDefined();
    store.remove(other.token);
    expect(store.get(other.token)).toBeUndefined();
    const expired = store.create("b", 1);
    now = SESSION_MS;
    expect(store.get(expired.token)).toBeUndefined();
  });
});
