import { describe, expect, it } from "vitest";
import { fieldsSchema } from "../shared/fields";
import { conditionSchema, isVisible } from "../shared/field-conditions";
import { validateFields } from "../shared/field-validation";
import { validateRequestData } from "../server/requests/validate-data";
import { advancedFields, advancedData } from "./fixtures/advanced-fields";
const form = {
  fields: advancedFields,
  validationProfile: "request-v2" as const,
};
describe("nested shared schema and API validation", () => {
  it("accepts advanced fields, strips unknown/hidden values and matches frontend/backend", () => {
    expect(fieldsSchema.safeParse(advancedFields).success).toBe(true);
    const result = validateFields(advancedFields, advancedData(), true);
    expect(result.errors).toEqual({});
    expect(result.data).not.toHaveProperty("unknown");
    expect(result.data).not.toHaveProperty("details.people.1.note");
    expect(validateRequestData(form, advancedData(), true)).toEqual(
      result.data,
    );
  });
  it("reports identical path errors for supplied invalid nested values and submission-only requirements", () => {
    const raw = advancedData();
    raw.details.people[0].note = "a";
    raw.items[0].quantity = 1.5;
    const result = validateFields(advancedFields, raw, true);
    expect(Object.keys(result.errors)).toEqual([
      "details.people.0.note",
      "items.0.quantity",
    ]);
    try {
      validateRequestData(form, raw, true);
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toMatchObject({ status: 422, fields: result.errors });
    }
    expect(validateFields(advancedFields, {}, false).errors).toEqual({});
    expect(
      Object.keys(validateFields(advancedFields, {}, true).errors),
    ).toHaveLength(4);
  });
  it("evaluates nested AND/OR across independent row, parent and root scopes", () => {
    const condition = advancedFields[2].fields![1].fields![2].visibility!;
    const raw = advancedData();
    const scope = {
      root: raw,
      parent: raw.details,
      row: raw.details.people[0],
    };
    expect(isVisible(condition, scope)).toBe(true);
    expect(isVisible(condition, { ...scope, row: raw.details.people[1] })).toBe(
      false,
    );
    raw.details.enabled = false;
    expect(isVisible(condition, scope)).toBe(false);
    expect(validateFields(advancedFields, raw, true).data).not.toHaveProperty(
      "details.people.0.note",
    );
    raw.details.enabled = true;
    raw.tags = ["normal"];
    expect(isVisible(condition, scope)).toBe(false);
    raw.requestTitle = "Override";
    expect(isVisible(condition, scope)).toBe(true);
    expect(
      isVisible({ op: "neq", scope: "row", key: "needs", value: false }, scope),
    ).toBe(true);
  });
  it("rejects invalid collection types, duplicates, bounds, rows and unknown options", () => {
    for (const tags of [
      "urgent",
      ["urgent", "urgent"],
      ["unknown"],
      [1],
      [],
      ["normal", "urgent", "extra"],
    ]) {
      expect(
        validateFields(advancedFields, { ...advancedData(), tags }, true)
          .errors,
      ).toHaveProperty("tags");
    }
    for (const items of [
      "bad",
      [null],
      [],
      [{ quantity: "2" }],
      Array.from({ length: 101 }, () => ({ quantity: 1 })),
    ]) {
      expect(
        Object.keys(
          validateFields(advancedFields, { ...advancedData(), items }, true)
            .errors,
        ).length,
      ).toBeGreaterThan(0);
    }
    expect(
      validateFields(advancedFields, { ...advancedData(), details: [] }, false)
        .errors,
    ).toHaveProperty("details");
  });
  it("rejects unsafe recursive schemas and conditions before publication", () => {
    const object = advancedFields[2];
    for (const patch of [
      { fields: [] },
      { fields: [object.fields![0], object.fields![0]] },
      { fields: [{ ...object.fields![0], key: "constructor" }] },
      { options: [] },
      { min: 1 },
    ]) {
      expect(fieldsSchema.safeParse([{ ...object, ...patch }]).success).toBe(
        false,
      );
    }
    expect(
      fieldsSchema.safeParse([{ ...advancedFields[1], maxLength: 101 }])
        .success,
    ).toBe(false);
    expect(
      conditionSchema.safeParse({ op: "and", conditions: [] }).success,
    ).toBe(false);
    expect(
      conditionSchema.safeParse({
        op: "eq",
        scope: "row",
        key: "constructor",
        value: true,
      }).success,
    ).toBe(false);
    expect(
      conditionSchema.safeParse({
        op: "eq",
        scope: "row",
        key: "name",
        value: true,
        script: "alert(1)",
      }).success,
    ).toBe(false);
    let nested: unknown = { op: "eq", scope: "row", key: "name", value: "x" };
    for (let i = 0; i < 100; i++) nested = { op: "and", conditions: [nested] };
    expect(conditionSchema.safeParse(nested).success).toBe(false);
  });
});
