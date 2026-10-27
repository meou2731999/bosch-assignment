import { randomUUID } from "node:crypto";
import type { BasicField } from "../../shared/fields";
import type { Condition } from "../../shared/field-conditions";
import { ApiError } from "../http/errors";

type KeyMap = Map<string, string>;
type ScopeMaps = Record<"root" | "row" | "parent", KeyMap>;
const temporary = (key: string) => key.startsWith("tmp_");

// Preserve legacy keys. Temporary builder references are never persisted.
export function assignFieldKeys(
  fields: BasicField[],
  history: BasicField[][] = [],
  generate = () => `f_${randomUUID().replaceAll("-", "")}`,
): BasicField[] {
  const used = new Set<string>();
  function reserve(items: BasicField[], historical = false) {
    for (const field of items) {
      if (historical || !temporary(field.key)) used.add(field.key);
      if (field.fields) reserve(field.fields, historical);
    }
  }
  history.forEach((items) => reserve(items, true));
  const historicalKeys = new Set(used);
  reserve(fields);
  function allocate() {
    for (let attempt = 0; attempt < 20; attempt++) {
      const key = generate();
      if (!used.has(key)) {
        used.add(key);
        return key;
      }
    }
    throw new ApiError(
      409,
      "CONFLICT",
      "Could not allocate a unique field identity. Retry saving.",
    );
  }
  const maps = new Map<BasicField[], KeyMap>();
  function prepare(items: BasicField[]) {
    maps.set(
      items,
      new Map(
        items.map((field) => [
          field.key,
          temporary(field.key) && !historicalKeys.has(field.key)
            ? allocate()
            : field.key,
        ]),
      ),
    );
    for (const field of items) if (field.fields) prepare(field.fields);
  }
  prepare(fields);
  function condition(value: Condition, scopes: ScopeMaps): Condition {
    if ("conditions" in value)
      return {
        ...value,
        conditions: value.conditions.map((child) => condition(child, scopes)),
      };
    const key = scopes[value.scope].get(value.key);
    if (!key)
      throw new ApiError(
        422,
        "INVALID",
        "A visibility condition references a missing field.",
      );
    return { ...value, key };
  }
  const root = maps.get(fields)!;
  function rewrite(items: BasicField[], parent: KeyMap): BasicField[] {
    const row = maps.get(items)!;
    return items.map((field) => ({
      ...field,
      key: row.get(field.key)!,
      ...(field.visibility
        ? { visibility: condition(field.visibility, { root, row, parent }) }
        : {}),
      ...(field.fields ? { fields: rewrite(field.fields, row) } : {}),
    }));
  }
  return rewrite(fields, root);
}
