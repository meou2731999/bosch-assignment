import type { BasicField } from "../../shared/fields";
export const advancedFields: BasicField[] = [
  {
    key: "requestTitle",
    label: "Title",
    input: "text",
    dataType: "string",
    required: true,
  },
  {
    key: "tags",
    label: "Tags",
    input: "multiselect",
    dataType: "array",
    required: true,
    maxLength: 2,
    options: [
      { label: "Urgent", value: "urgent" },
      { label: "Normal", value: "normal" },
    ],
  },
  {
    key: "details",
    label: "Details",
    input: "object",
    dataType: "object",
    required: true,
    fields: [
      {
        key: "enabled",
        label: "Enabled",
        input: "checkbox",
        dataType: "boolean",
        required: false,
      },
      {
        key: "people",
        label: "People",
        input: "repeat",
        dataType: "array",
        required: true,
        maxLength: 3,
        fields: [
          {
            key: "name",
            label: "Name",
            input: "text",
            dataType: "string",
            required: true,
          },
          {
            key: "needs",
            label: "Needs note",
            input: "checkbox",
            dataType: "boolean",
            required: false,
          },
          {
            key: "note",
            label: "Note",
            input: "text",
            dataType: "string",
            required: true,
            minLength: 3,
            visibility: {
              op: "and",
              conditions: [
                { op: "eq", scope: "row", key: "needs", value: true },
                { op: "eq", scope: "parent", key: "enabled", value: true },
                {
                  op: "or",
                  conditions: [
                    {
                      op: "contains",
                      scope: "root",
                      key: "tags",
                      value: "urgent",
                    },
                    {
                      op: "eq",
                      scope: "root",
                      key: "requestTitle",
                      value: "Override",
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    key: "items",
    label: "Items",
    input: "table",
    dataType: "array",
    required: true,
    minLength: 1,
    maxLength: 2,
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        input: "number",
        dataType: "number",
        required: true,
        min: 1,
        max: 5,
        integer: true,
      },
    ],
  },
];
export function advancedData() {
  return {
    requestTitle: "Nested request",
    tags: ["urgent"],
    details: {
      enabled: true,
      people: [
        { name: "Alex", needs: true, note: "Valid note" },
        { name: "Sam", needs: false, note: 42 },
      ],
    },
    items: [{ quantity: 2 }],
    unknown: "discard",
  };
}
