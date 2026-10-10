import type { BasicField } from "../../shared/fields";
export const oldFields: BasicField[] = [
  {
    key: "requestTitle",
    label: "Title",
    input: "text",
    dataType: "string",
    required: true,
  },
  {
    key: "amount",
    label: "Amount",
    input: "number",
    dataType: "number",
    required: true,
    min: 1,
    max: 10,
  },
  {
    key: "obsolete",
    label: "Obsolete",
    input: "text",
    dataType: "string",
    required: false,
  },
];
export const newFields: BasicField[] = [
  { ...oldFields[0] },
  { ...oldFields[1], max: 2 },
  {
    key: "contact",
    label: "Contact",
    input: "email",
    dataType: "string",
    required: true,
  },
];
export const draftData = {
  requestTitle: "Upgrade draft",
  amount: 5,
  obsolete: "Keep in snapshot",
};

export const validData = {
  requestTitle: draftData.requestTitle,
  amount: 2,
  contact: "team@example.test",
};
