import type { BasicField } from "../../../../shared/fields";
import {
  isVisible,
  type FieldScope,
} from "../../../../shared/field-conditions";
import { isObject } from "../../../../shared/field-values";
import type { Locale } from "../../../../shared/model";
import { ScalarField } from "./ScalarField";
import { RowsField } from "./RowsField";
export interface TreeProps {
  fields: BasicField[];
  scope: FieldScope;
  readOnly: boolean;
  locale: Locale;
  onChange: (data: Record<string, unknown>) => void;
}
export function FieldTree(props: Readonly<TreeProps>) {
  const { fields, scope, onChange } = props;
  return (
    <>
      {fields
        .filter((field) => isVisible(field.visibility, scope))
        .map((field) => {
          const value = scope.row[field.key];
          const update = (next: unknown) =>
            onChange({ ...scope.row, [field.key]: next });
          if (field.input === "object") {
            const row = isObject(value) ? value : {};
            return (
              <fieldset key={field.key}>
                <legend>{field.label}</legend>
                <FieldTree
                  {...props}
                  fields={field.fields ?? []}
                  scope={{ root: scope.root, parent: scope.row, row }}
                  onChange={update}
                />
              </fieldset>
            );
          }
          if (field.input === "repeat" || field.input === "table")
            return (
              <RowsField
                key={field.key}
                {...props}
                field={field}
                value={Array.isArray(value) ? value : []}
                onUpdate={update}
              />
            );
          return (
            <ScalarField
              key={field.key}
              field={field}
              value={value}
              readOnly={props.readOnly}
              onChange={update}
            />
          );
        })}
    </>
  );
}
