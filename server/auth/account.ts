import { z } from "zod";
import type { User } from "../../shared/model";
export interface Account extends User {
  email: string;
  isAdmin: boolean;
  active: boolean;
  mustChangePassword: boolean;
  passwordHash: string | null;
  credentialVersion: number;
  permissionRevision: number;
  permissionAudit?: {
    actorId: string;
    at: string;
    formPermissions: Account["formPermissions"];
  }[];
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
    formPermissions: structuredClone(account.formPermissions),
    permissionRevision: account.permissionRevision,
  };
}
export const createSchema = z.object({
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

export const editSchema = createSchema
  .pick({ email: true, name: true, department: true, role: true })
  .partial()
  .extend({ isAdmin: z.boolean().optional(), active: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
