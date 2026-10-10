export { publicAccount } from "./account";
import {
  createSchema,
  editSchema,
  publicAccount,
  type Account,
} from "./account";
export type { Account } from "./account";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { USERS } from "../../shared/model";
import { ApiError } from "../http/errors";
import { hashPassword } from "./password";
export function createUserStore(dataDir: string) {
  mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, "users.json");
  let users: Account[];
  try {
    users = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    users = USERS.map((user) => ({
      ...user,
      email: `${user.id}@example.test`,
      isAdmin: false,
      active: false,
      mustChangePassword: true,
      passwordHash: null,
      credentialVersion: 0,
      permissionRevision: 0,
    }));
    persist(users);
  }
  if (
    users.some(
      (user) => !user.formPermissions || user.permissionRevision === undefined,
    )
  ) {
    persist(
      users.map((user) => ({
        ...user,
        formPermissions: user.formPermissions ?? {
          request: user.role === "reviewer" ? ["view", "review"] : ["create"],
        },
        permissionRevision: user.permissionRevision ?? 0,
      })),
    );
  }
  function persist(next: Account[]) {
    writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2), {
      mode: 0o600,
    });
    renameSync(`${file}.tmp`, file);
    users = next;
  }
  function get(id: string) {
    const user = users.find((user) => user.id === id);
    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found.");
    return user;
  }
  function update(id: string, patch: Partial<Account>) {
    const previous = get(id);
    const next = { ...previous, ...patch };
    if (
      previous.active &&
      previous.isAdmin &&
      (!next.active || !next.isAdmin) &&
      !users.some((user) => user.id !== id && user.active && user.isAdmin)
    )
      throw new ApiError(
        409,
        "LAST_ADMIN",
        "Keep at least one active administrator.",
      );
    persist(users.map((user) => (user.id === id ? next : user)));
    return next;
  }
  return {
    all: () => users.map(publicAccount),
    get,
    byEmail: (email: string) =>
      users.find((user) => user.email === email.trim().toLowerCase()),
    async create(raw: unknown, bootstrap = false) {
      const parsed = createSchema.safeParse(raw);
      if (!parsed.success)
        throw new ApiError(422, "INVALID", "Invalid account details.");
      const { password, ...details } = parsed.data;
      const passwordHash = await hashPassword(password);
      if (bootstrap && users.some((user) => user.active && user.isAdmin))
        throw new ApiError(
          409,
          "ADMIN_EXISTS",
          "An administrator already exists.",
        );
      if (users.some((user) => user.email === details.email))
        throw new ApiError(409, "EMAIL_EXISTS", "Email already exists.");
      const account: Account = {
        ...details,
        formPermissions: {},
        permissionRevision: 0,
        id: randomUUID(),
        passwordHash,
        active: true,
        mustChangePassword: !bootstrap,
        credentialVersion: 1,
      };
      persist([...users, account]);
      return account;
    },
    async password(
      id: string,
      password: string,
      mustChangePassword: boolean,
      expectedVersion?: number,
    ) {
      const passwordHash = await hashPassword(password);
      const user = get(id);
      if (
        expectedVersion !== undefined &&
        user.credentialVersion !== expectedVersion
      )
        throw new ApiError(
          409,
          "CONFLICT",
          "Account credentials changed. Sign in again.",
        );
      return update(id, {
        passwordHash,
        mustChangePassword,
        credentialVersion: user.credentialVersion + 1,
      });
    },
    edit(id: string, raw: unknown) {
      const parsed = editSchema.safeParse(raw);
      if (!parsed.success)
        throw new ApiError(422, "INVALID", "Invalid account changes.");
      const user = get(id);
      if (
        parsed.data.email &&
        users.some(
          (other) => other.id !== id && other.email === parsed.data.email,
        )
      )
        throw new ApiError(409, "EMAIL_EXISTS", "Email already exists.");
      if (parsed.data.active && !user.passwordHash)
        throw new ApiError(
          409,
          "PASSWORD_REQUIRED",
          "Set a password before enabling this user.",
        );
      return update(id, {
        ...parsed.data,
        credentialVersion: user.credentialVersion + 1,
      });
    },
    setPermissions(
      id: string,
      permissions: Account["formPermissions"],
      revision: number,
      actorId: string,
    ) {
      const user = get(id);
      if (user.permissionRevision !== revision)
        throw new ApiError(
          409,
          "CONFLICT",
          "User permissions changed. Reload before saving.",
        );
      return update(id, {
        formPermissions: structuredClone(permissions),
        permissionRevision: revision + 1,
        credentialVersion: user.credentialVersion + 1,
        permissionAudit: [
          ...(user.permissionAudit ?? []),
          {
            actorId,
            at: new Date().toISOString(),
            formPermissions: structuredClone(permissions),
          },
        ],
      });
    },
    setActive(id: string, active: boolean) {
      const user = get(id);
      if (active && !user.passwordHash)
        throw new ApiError(
          409,
          "PASSWORD_REQUIRED",
          "Set a password before enabling this user.",
        );
      return update(id, {
        active,
        credentialVersion: user.credentialVersion + 1,
      });
    },
  };
}
export type UserStore = ReturnType<typeof createUserStore>;
