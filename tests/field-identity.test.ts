import { expect, it } from "vitest";
import { assignFieldKeys } from "../server/forms/field-identity";
import type { BasicField } from "../shared/fields";
const scalar = (key: string): BasicField => ({
  key,
  label: key,
  input: "text",
  dataType: "string",
  required: false,
});
it("remaps nested row/parent/root conditions and retries generated collisions", () => {
  const source: BasicField[] = [
    scalar("legacy"),
    scalar("tmp_root"),
    {
      key: "tmp_group",
      label: "Group",
      input: "object",
      dataType: "object",
      required: false,
      fields: [
        scalar("tmp_parent"),
        {
          key: "tmp_rows",
          label: "Rows",
          input: "repeat",
          dataType: "array",
          required: false,
          fields: [
            scalar("tmp_switch"),
            {
              ...scalar("tmp_note"),
              visibility: {
                op: "and",
                conditions: [
                  { op: "eq", scope: "root", key: "tmp_root", value: "yes" },
                  {
                    op: "eq",
                    scope: "parent",
                    key: "tmp_parent",
                    value: "yes",
                  },
                  { op: "eq", scope: "row", key: "tmp_switch", value: "yes" },
                ],
              },
            },
          ],
        },
      ],
    },
  ];
  const ids = [
    "legacy",
    "deleted",
    "f_root",
    "f_group",
    "f_parent",
    "f_rows",
    "f_switch",
    "f_note",
  ];
  const result = assignFieldKeys(source, [[scalar("deleted")]], () =>
    ids.shift()!,
  );
  expect(result[0].key).toBe("legacy");
  expect(result[1].key).toBe("f_root");
  const children = result[2].fields!;
  const note = children[1].fields![1];
  expect(note.visibility).toEqual({
    op: "and",
    conditions: [
      { op: "eq", scope: "root", key: "f_root", value: "yes" },
      { op: "eq", scope: "parent", key: "f_parent", value: "yes" },
      { op: "eq", scope: "row", key: "f_switch", value: "yes" },
    ],
  });
  expect(source[1].key).toBe("tmp_root");
  const renamed = result
    .map((field) => ({ ...field, label: "Renamed" }))
    .reverse();
  expect(assignFieldKeys(renamed, [result])).toEqual(renamed);
});
it("rejects dangling references and repeated allocation collisions", () => {
  expect(() =>
    assignFieldKeys([
      {
        ...scalar("tmp_note"),
        visibility: { op: "eq", scope: "row", key: "missing", value: "" },
      },
    ]),
  ).toThrow("missing field");
  expect(() =>
    assignFieldKeys([scalar("legacy"), scalar("tmp_new")], [], () => "legacy"),
  ).toThrow("unique field identity");
});
