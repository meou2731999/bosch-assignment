import type { BasicField } from "../../../../shared/fields";
import { isObject } from "../../../../shared/field-values";
import { Button } from "../../../components/ui/Button";
import { FieldTree, type TreeProps } from "./FieldTree";
export function RowsField(
  props: TreeProps & {
    field: BasicField;
    value: unknown[];
    onUpdate: (rows: unknown[]) => void;
  },
) {
  const { field, value, readOnly, onUpdate, locale } = props;
  const remove = (index: number) => (
    <Button
      variant="danger"
      disabled={readOnly}
      onClick={() => onUpdate(value.filter((_, i) => i !== index))}
    >
      {locale === "vi" ? "Xóa hàng" : "Remove row"}
    </Button>
  );
  function cells(item: unknown, index: number, fields = field.fields ?? []) {
    const row = isObject(item) ? item : {};
    return (
      <FieldTree
        {...props}
        fields={fields}
        scope={{ root: props.scope.root, parent: props.scope.row, row }}
        onChange={(next) =>
          onUpdate(value.map((entry, i) => (i === index ? next : entry)))
        }
      />
    );
  }
  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.input === "table" ? (
        <table className="w-full">
          <thead>
            <tr>
              {field.fields?.map((child) => (
                <th key={child.key}>{child.label}</th>
              ))}
              {!readOnly && <th>{locale === "vi" ? "Thao tác" : "Actions"}</th>}
            </tr>
          </thead>
          <tbody>
            {value.map((item, index) => (
              <tr key={index}>
                {field.fields?.map((child) => (
                  <td key={child.key}>{cells(item, index, [child])}</td>
                ))}
                {!readOnly && <td>{remove(index)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        value.map((item, index) => (
          <fieldset key={index}>
            <legend>{index + 1}</legend>
            {cells(item, index)}
            {!readOnly && remove(index)}
          </fieldset>
        ))
      )}
      {!readOnly && (
        <Button
          variant="secondary"
          disabled={readOnly || value.length >= (field.maxLength ?? 100)}
          onClick={() => onUpdate([...value, {}])}
        >
          {locale === "vi" ? "Thêm hàng" : "Add row"}
        </Button>
      )}
    </fieldset>
  );
}
