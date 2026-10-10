import { describe, expect, it } from "vitest";
import { authFixture } from "./helpers/auth-api";
const fixture = authFixture();
const { send, login, start, stop, password } = fixture;
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
        await send("/auth/logout", "POST", {}, fixture.admin, {
          "x-csrf-token": "wrong",
        })
      ).status,
    ).toBe(403);
    expect(
      (await send("/auth/session", "GET", undefined, fixture.admin)).status,
    ).toBe(200);
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
      fixture.admin,
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
          fixture.admin,
        )
      ).status,
    ).toBe(200);
    expect(
      (await send("/auth/session", "GET", undefined, current)).status,
    ).toBe(401);
    const reset = await login(user.email, "reset-password-test");
    expect((await send("/requests", "GET", undefined, reset)).status).toBe(403);
    expect(
      (
        await send(
          `/admin/users/${user.id}`,
          "PATCH",
          { active: false },
          fixture.admin,
        )
      ).status,
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
      (
        await send(
          `/admin/users/${user.id}`,
          "PATCH",
          { active: true },
          fixture.admin,
        )
      ).status,
    ).toBe(200);
    const enabled = await login(user.email, "reset-password-test");
    expect((await send("/auth/logout", "POST", {}, enabled)).status).toBe(204);
    expect(
      (await send("/auth/session", "GET", undefined, enabled)).status,
    ).toBe(401);
  });
  it("protects last admin and invalidates sessions on restart while keeping accounts", async () => {
    const self = await (
      await send("/auth/session", "GET", undefined, fixture.admin)
    ).json();
    expect(
      (
        await send(
          `/admin/users/${self.user.id}`,
          "PATCH",
          { active: false },
          fixture.admin,
        )
      ).status,
    ).toBe(409);
    await stop();
    await start();
    expect(
      (await send("/auth/session", "GET", undefined, fixture.admin)).status,
    ).toBe(401);
    fixture.admin = await login("admin@example.test");
    expect(
      (await send("/admin/users", "GET", undefined, fixture.admin)).status,
    ).toBe(200);
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
