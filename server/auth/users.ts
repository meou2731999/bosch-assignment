import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { USERS, type User } from "../../shared/model";
import { ApiError } from "../http/errors";
import { hashPassword } from "./password";
export interface Account extends User {
  email: string;
  isAdmin: boolean;
  active: boolean;
  mustChangePassword: boolean;
  passwordHash: string | null;
  credentialVersion: number;
}
export function publicAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    department: account.department,
    role: account.role,
    email: account.email,
    isAdmin: account.isAdmin,
    active: account.active,
    mustChangePassword: account.mustChangePassword,
  };
}
const createSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  department: z.string().trim().min(1).max(120),
  role: z.enum(["requester", "reviewer"]),
  isAdmin: z.boolean().default(false),
  password: z.string(),
});
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
    }));
    persist(users);
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
      const parsed = createSchema
        .pick({ email: true, name: true, department: true, role: true })
        .partial()
        .extend({
          isAdmin: z.boolean().optional(),
          active: z.boolean().optional(),
        })
        .strict()
        .refine((value) => Object.keys(value).length > 0)
        .safeParse(raw);
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
