import type { AccountUser } from "../../../shared/model";
import { call, request, setCsrfToken } from "../../lib/http";
interface Session {
  user: AccountUser;
  csrfToken: string;
}
async function sessionCall(path: string, init?: RequestInit) {
  const session = await call<Session>(null, path, init);
  setCsrfToken(session.csrfToken);
  return session.user;
}
export const authApi = {
  session: () => sessionCall("/auth/session"),
  login: (email: string, password: string) =>
    sessionCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: async () => {
    await request(null, "/auth/logout", { method: "POST" });
    setCsrfToken("");
  },
  changePassword: async (currentPassword: string, password: string) => {
    await request(null, "/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, password }),
    });
    setCsrfToken("");
  },
};
export const adminApi = {
  list: () => call<AccountUser[]>(null, "/admin/users"),
  create: (input: unknown) =>
    call<AccountUser>(null, "/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  edit: (id: string, input: unknown) =>
    call<AccountUser>(null, `/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  reset: (id: string, password: string) =>
    call<AccountUser>(
      null,
      `/admin/users/${encodeURIComponent(id)}/reset-password`,
      { method: "POST", body: JSON.stringify({ password }) },
    ),
};
