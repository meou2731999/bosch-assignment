import { createHash, randomBytes } from "node:crypto";
export const SESSION_MS = 8 * 60 * 60 * 1000;
export const COOKIE_NAME = "request_session";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function createSessionStore(now = () => Date.now()) {
  const sessions = new Map<
    string,
    {
      userId: string;
      credentialVersion: number;
      csrfToken: string;
      expires: number;
    }
  >();
  return {
    create(userId: string, credentialVersion: number) {
      for (const [key, session] of sessions)
        if (session.expires <= now()) sessions.delete(key);
      const token = randomBytes(32).toString("hex");
      const session = {
        userId,
        credentialVersion,
        csrfToken: randomBytes(32).toString("hex"),
        expires: now() + SESSION_MS,
      };
      sessions.set(digest(token), session);
      return { token, ...session };
    },
    get(token: string) {
      const session = sessions.get(digest(token));
      if (session && session.expires > now()) return session;
      sessions.delete(digest(token));
      return undefined;
    },
    remove: (token: string) => sessions.delete(digest(token)),
    revoke(userId: string) {
      for (const [key, session] of sessions)
        if (session.userId === userId) sessions.delete(key);
    },
  };
}
