import type { Express, Request } from "express";
import { z } from "zod";
import { ApiError } from "../http/errors";
import { verifyPassword, hashPassword } from "./password";
import { publicAccount, type UserStore } from "./users";
import { COOKIE_NAME, SESSION_MS, createSessionStore } from "./sessions";
function cookieToken(req: Request) {
  return (
    req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1) ?? ""
  );
}
export function registerAuth(
  app: Express,
  users: UserStore,
  secureCookies: boolean,
) {
  const sessions = createSessionStore();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: secureCookies,
    path: "/api",
  };
  const attempts = new Map<string, { count: number; expires: number }>();
  const dummyHash = hashPassword("dummy-password-not-an-account");
  app.post("/api/auth/login", async (req, res) => {
    // No CORS is enabled; JSON and a custom header prevent cross-site login requests.
    if (
      !req.is("application/json") ||
      req.header("x-requested-with") !== "RequestDesk"
    )
      throw new ApiError(403, "CSRF", "Invalid login request.");
    const parsed = z
      .object({
        email: z.string().trim().email().max(254),
        password: z.string().max(256),
      })
      .safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", "Enter your email and password.");
    const now = Date.now();
    for (const [key, item] of attempts)
      if (item.expires <= now) attempts.delete(key);
    const email = parsed.data.email.toLowerCase();
    const keys = [`ip:${req.ip}`, `email:${email}`];
    if (
      keys.some(
        (key) =>
          (attempts.get(key)?.count ?? 0) >= (key.startsWith("ip:") ? 50 : 10),
      )
    )
      throw new ApiError(
        429,
        "RATE_LIMIT",
        "Too many sign-in attempts. Retry in 15 minutes.",
      );
    for (const key of keys) {
      const item = attempts.get(key) ?? {
        count: 0,
        expires: now + 15 * 60 * 1000,
      };
      item.count++;
      attempts.set(key, item);
    }
    const account = users.byEmail(email);
    const valid = await verifyPassword(
      parsed.data.password,
      account?.passwordHash ?? (await dummyHash),
    );
    // Re-read after async hashing to detect concurrent reset/disable.
    const current = account ? users.get(account.id) : undefined;
    if (
      !valid ||
      !current?.active ||
      current.credentialVersion !== account?.credentialVersion ||
      !account?.passwordHash
    )
      throw new ApiError(401, "CREDENTIALS", "Invalid email or password.");
    attempts.delete(`email:${email}`);
    sessions.remove(cookieToken(req));
    const session = sessions.create(current.id, current.credentialVersion);
    res.cookie(COOKIE_NAME, session.token, {
      ...cookieOptions,
      maxAge: SESSION_MS,
    });
    res.json({ user: publicAccount(current), csrfToken: session.csrfToken });
  });
  app.use("/api", (req, res, next) => {
    const session = sessions.get(cookieToken(req));
    if (!session)
      return next(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."));
    const user = users.get(session.userId);
    if (!user.active || user.credentialVersion !== session.credentialVersion)
      return next(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."));
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.header("x-csrf-token") !== session.csrfToken
    )
      return next(new ApiError(403, "CSRF", "Invalid CSRF token."));
    res.locals.user = user;
    res.locals.session = session;
    next();
  });
  app.get("/api/auth/session", (_req, res) =>
    res.json({
      user: publicAccount(res.locals.user),
      csrfToken: res.locals.session.csrfToken,
    }),
  );
  app.post("/api/auth/logout", (req, res) => {
    sessions.remove(cookieToken(req));
    res.clearCookie(COOKIE_NAME, cookieOptions).status(204).end();
  });
  app.post("/api/auth/change-password", async (req, res) => {
    const parsed = z
      .object({ currentPassword: z.string().max(256), password: z.string() })
      .safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", "Enter current and new passwords.");
    const user = res.locals.user;
    if (
      !user.passwordHash ||
      !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))
    )
      throw new ApiError(401, "CREDENTIALS", "Current password is incorrect.");
    if (parsed.data.currentPassword === parsed.data.password)
      throw new ApiError(422, "PASSWORD", "Choose a different password.");
    await users.password(
      user.id,
      parsed.data.password,
      false,
      user.credentialVersion,
    );
    sessions.revoke(user.id);
    res.clearCookie(COOKIE_NAME, cookieOptions).status(204).end();
  });
  app.use("/api", (_req, res, next) => {
    if (res.locals.user.mustChangePassword)
      return next(
        new ApiError(
          403,
          "PASSWORD_CHANGE_REQUIRED",
          "Change your initial password before continuing.",
        ),
      );
    next();
  });
  app.use("/api/admin", (_req, res, next) => {
    if (!res.locals.user.isAdmin)
      return next(
        new ApiError(403, "FORBIDDEN", "Administrator access required."),
      );
    next();
  });
  app.get("/api/admin/users", (_req, res) => res.json(users.all()));
  app.post("/api/admin/users", async (req, res) =>
    res.status(201).json(publicAccount(await users.create(req.body))),
  );
  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    const parsed = z.object({ password: z.string() }).safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", "Enter a new password.");
    const user = await users.password(
      String(req.params.id),
      parsed.data.password,
      true,
    );
    sessions.revoke(user.id);
    res.json(publicAccount(user));
  });
  app.patch("/api/admin/users/:id", (req, res) => {
    const parsed = z
      .object({ active: z.boolean() })
      .strict()
      .safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", "Supply the account active status.");
    const user = users.setActive(String(req.params.id), parsed.data.active);
    sessions.revoke(user.id);
    res.json(publicAccount(user));
  });
}
