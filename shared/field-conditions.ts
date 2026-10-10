import { withinBudget } from "./schema-budget";
import { z } from "zod";
export type Condition =
  | { op: "and" | "or"; conditions: Condition[] }
  | {
      op: "eq" | "neq" | "contains";
      scope: "root" | "row" | "parent";
      key: string;
      value: string | number | boolean;
    };
export const conditionSchema: z.ZodType<Condition> = z.preprocess(
  (value, ctx) => {
    if (!withinBudget(value, 16, 1000)) {
      ctx.addIssue({
        code: "custom",
        message: "Condition is too deeply nested or too large.",
      });
      return z.NEVER;
    }
    return value;
  },
  z.lazy(() =>
    z.union([
      z
        .object({
          op: z.enum(["and", "or"]),
          conditions: z.array(conditionSchema).min(1).max(20),
        })
        .strict(),
      z
        .object({
          op: z.enum(["eq", "neq", "contains"]),
          scope: z.enum(["root", "row", "parent"]),
          key: z
            .string()
            .regex(/^[a-zA-Z]\w{0,63}$/)
            .refine(
              (key) => !["constructor", "prototype", "__proto__"].includes(key),
            ),
          value: z.union([
            z.string().max(120),
            z.number().finite(),
            z.boolean(),
          ]),
        })
        .strict(),
    ]),
  ),
);
export interface FieldScope {
  root: Record<string, unknown>;
  row: Record<string, unknown>;
  parent: Record<string, unknown>;
}
export function isVisible(
  condition: Condition | undefined,
  scope: FieldScope,
): boolean {
  if (!condition) return true;
  if (condition.op === "and" || condition.op === "or") {
    const values = condition.conditions.map((child) => isVisible(child, scope));
    return condition.op === "and"
      ? values.every(Boolean)
      : values.some(Boolean);
  }
  if (!("key" in condition)) return false;
  const source = scope[condition.scope];
  const value = Object.hasOwn(source, condition.key)
    ? source[condition.key]
    : undefined;
  if (condition.op === "contains")
    return Array.isArray(value) && value.includes(condition.value);
  return condition.op === "eq"
    ? value === condition.value
    : value !== condition.value;
}
