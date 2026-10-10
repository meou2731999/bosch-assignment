import { useState } from "react";
import { fieldsSchema, type BasicField } from "../../../../shared/fields";
import { fieldDefinition } from "../../../../shared/field-definition";
import type { Locale } from "../../../../shared/model";
import { Button } from "../../../components/ui/Button";
import { DynamicForm } from "../../forms/DynamicForm";
import { FieldEditor } from "./FieldEditor";
import { fieldCopy } from "./copy";
const emptyData = {};
const noop = () => {};
export function FieldsEditor({
  fields,
  locale,
  onChange: onFieldsChange,
}: {
  fields: BasicField[];
  locale: Locale;
  onChange: (fields: BasicField[]) => void;
}) {
  const t = fieldCopy(locale);
  const [ids, setIds] = useState(() => fields.map(() => crypto.randomUUID()));
  const [preview, setPreview] = useState<ReturnType<
    typeof fieldDefinition
  > | null>(null);
  function onChange(next: BasicField[]) {
    setPreview(null);
    onFieldsChange(next);
  }
  const valid = fieldsSchema.safeParse(fields).success;
  function move(index: number, direction: number) {
    const next = [...fields],
      keys = [...ids];
    const other = index + direction;
    [next[index], next[other]] = [next[other], next[index]];
    [keys[index], keys[other]] = [keys[other], keys[index]];
    setIds(keys);
    onChange(next);
  }
  return (
    <div className="tw:space-y-4">
      {fields.map((field, index) => (
        <FieldEditor
          key={ids[index]}
          field={field}
          index={index}
          count={fields.length}
          locale={locale}
          onChange={(next) =>
            onChange(fields.map((item, i) => (i === index ? next : item)))
          }
          onMove={(direction) => move(index, direction)}
          onRemove={() => {
            setIds(ids.filter((_, i) => i !== index));
            onChange(fields.filter((_, i) => i !== index));
          }}
        />
      ))}
      {!valid && <p role="alert">{fields.length ? t.invalid : t.empty}</p>}
      <div className="tw:flex tw:gap-3">
        <Button
          variant="secondary"
          disabled={fields.length >= 50}
          onClick={() => {
            setIds([...ids, crypto.randomUUID()]);
            onChange([
              ...fields,
              {
                key: `field${crypto.randomUUID().slice(0, 8)}`,
                label: "New field",
                input: "text",
                dataType: "string",
                required: false,
              },
            ]);
          }}
        >
          {t.add}
        </Button>
        <Button
          variant="secondary"
          disabled={!valid}
          onClick={() => setPreview(fieldDefinition(t.preview, fields))}
        >
          {t.preview}
        </Button>
      </div>
      {preview && (
        <section
          aria-label={t.preview}
          className="tw:rounded-lg tw:border tw:border-line tw:p-4"
        >
          <h3>{t.preview}</h3>
          <DynamicForm
            key={JSON.stringify(preview)}
            definition={preview}
            initialData={emptyData}
            locale={locale}
            readOnly={false}
            onReady={noop}
            onDirty={noop}
          />
        </section>
      )}
    </div>
  );
}
