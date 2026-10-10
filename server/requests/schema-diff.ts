import type { BasicField } from "../../shared/fields";
import type { PublishedForm } from "../../shared/forms";
import type { SchemaChange } from "../../shared/draft-history";
function flatten(
  fields: BasicField[],
  prefix = "",
  result = new Map<string, Record<string, unknown>>(),
) {
  fields.forEach((field, position) => {
    const path = prefix + field.key;
    const own = { ...field, position };
    delete own.fields;
    result.set(path, own);
    if (field.fields)
      flatten(
        field.fields,
        path + (field.dataType === "array" ? "[]." : "."),
        result,
      );
  });
  return result;
}
function legacy(
  components: Record<string, unknown>[],
  prefix = "",
  result = new Map<string, Record<string, unknown>>(),
) {
  components.forEach((component, position) => {
    const path = prefix + component.key;
    const own: Record<string, unknown> = { ...component, position };
    delete own.components;
    result.set(path, own);
    if (Array.isArray(component.components))
      legacy(component.components, path + ".", result);
  });
  return result;
}
export function schemaDiff(
  before: PublishedForm,
  after: PublishedForm,
): SchemaChange[] {
  const old = before.fields
    ? flatten(before.fields)
    : legacy(before.definition.components);
  const next = after.fields
    ? flatten(after.fields)
    : legacy(after.definition.components);
  const changes: SchemaChange[] = [];
  for (const path of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(path),
      b = next.get(path);
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    let kind: SchemaChange["kind"] = "added";
    if (a) kind = b ? "changed" : "removed";
    changes.push({ path, kind, before: a, after: b });
  }
  return changes;
}
