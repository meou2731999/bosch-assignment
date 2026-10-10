import { describe, expect, it } from "vitest";
import { fieldsSchema, type BasicField } from "../shared/fields";
import { validateFields } from "../shared/field-validation";
import { fieldDefinition } from "../shared/field-definition";
const title: BasicField = {
  key: "title",
  label: "Title",
  input: "text",
  dataType: "string",
  required: true,
  minLength: 3,
  maxLength: 8,
};
const amount: BasicField = {
  key: "amount",
  label: "Amount",
  input: "number",
  dataType: "number",
  required: true,
  min: 1,
  max: 5,
  integer: true,
};
describe("basic field schema safety", () => {
  it("rejects duplicate/reserved/path keys, incompatible types, invalid bounds and executable properties", () => {
    for (const fields of [
      [title, title],
      [{ ...title, key: "constructor" }],
      [{ ...title, key: "a.b" }],
      [{ ...title, dataType: "number" }],
      [{ ...amount, min: 9, max: 1 }],
      [{ ...title, minLength: 9, maxLength: 1 }],
      [{ ...title, customConditional: "alert(1)" }],
      [{ ...title, input: "select", options: [] }],
      [
        {
          ...title,
          input: "select",
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "a" },
          ],
        },
      ],
    ])
      expect(fieldsSchema.safeParse(fields).success).toBe(false);
    expect(fieldsSchema.safeParse([title, amount]).success).toBe(true);
  });
  it("bounds schema size and rejects nested inputs before publication", () => {
    expect(fieldsSchema.safeParse([]).success).toBe(false);
    expect(
      fieldsSchema.safeParse(
        Array.from({ length: 51 }, (_, i) => ({ ...title, key: `field${i}` })),
      ).success,
    ).toBe(false);
    expect(
      fieldsSchema.safeParse([{ ...title, input: "object" }]).success,
    ).toBe(false);
  });
});
describe("shared dynamic validation", () => {
  it("allows incomplete drafts and requires completed submissions without trusting extra properties", () => {
    expect(validateFields([title, amount], {}, false)).toEqual({
      data: {},
      errors: {},
    });
    expect(validateFields([title, amount], {}, true).errors).toHaveProperty(
      "title",
    );
    expect(
      validateFields(
        [title, amount],
        { title: "Valid", amount: 2, ownerId: "spoofed", extra: { a: 1 } },
        true,
      ),
    ).toEqual({ data: { title: "Valid", amount: 2 }, errors: {} });
  });
  it("validates numeric boundaries and types on drafts as well as submissions", () => {
    for (const value of [0, 6, 1.5, "2", false, {}, NaN, Infinity])
      expect(
        validateFields([amount], { amount: value }, false).errors,
      ).toHaveProperty("amount");
    for (const value of [1, 5])
      expect(validateFields([amount], { amount: value }, true).errors).toEqual(
        {},
      );
    expect(
      validateFields([{ ...amount, integer: false }], { amount: 1.5 }, true)
        .errors,
    ).toEqual({});
  });
  it("validates string bounds and required whitespace", () => {
    for (const value of ["a", "too long value", 23, {}, "   "])
      expect(
        validateFields([title], { title: value }, true).errors,
      ).toHaveProperty("title");
    expect(validateFields([title], { title: "   " }, false).errors).toEqual({});
  });
  it("validates email, real calendar dates, booleans and configured select values", () => {
    const fields: BasicField[] = [
      {
        ...title,
        key: "email",
        input: "email",
        minLength: undefined,
        maxLength: 100,
      },
      {
        ...title,
        key: "date",
        input: "date",
        minLength: undefined,
        maxLength: undefined,
      },
      {
        key: "consent",
        label: "Consent",
        input: "checkbox",
        dataType: "boolean",
        required: true,
      },
      {
        ...title,
        key: "choice",
        input: "select",
        minLength: undefined,
        options: [{ label: "One", value: "one" }],
      },
    ];
    const valid = {
      email: "user@example.test",
      date: "2028-02-29",
      consent: true,
      choice: "one",
    };
    expect(validateFields(fields, valid, true).errors).toEqual({});
    expect(
      Object.keys(
        validateFields(
          fields,
          {
            email: "invalid",
            date: "2026-02-29",
            consent: false,
            choice: "invented",
          },
          true,
        ).errors,
      ),
    ).toEqual(["email", "date", "consent", "choice"]);
    expect(
      validateFields(fields, { ...valid, date: "2028-04-31" }, true).errors,
    ).toHaveProperty("date");
    expect(
      validateFields(fields, { ...valid, consent: "true" }, true).errors,
    ).toHaveProperty("consent");
    expect(
      validateFields(fields, { ...valid, consent: false }, false).errors,
    ).toEqual({});
  });
  it("generates only supported Form.io components in configured order", () => {
    const definition = fieldDefinition("Custom form", [amount, title]);
    expect(definition.components.map((field) => field.key)).toEqual([
      "amount",
      "title",
    ]);
    expect(definition.components[0]).toMatchObject({
      type: "number",
      validate: { required: true, min: 1, max: 5 },
      decimalLimit: 0,
    });
    expect(definition.components[1]).toMatchObject({
      type: "textfield",
      validate: { minLength: 3, maxLength: 8 },
    });
  });
});
