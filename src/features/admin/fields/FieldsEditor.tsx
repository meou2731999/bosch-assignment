import { uiCopy } from "../../../i18n/ui";
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
export const FieldsEditor = ({
  fields,
  locale,
  rootFields,
  parentFields,
  onChange: onFieldsChange,
}: Readonly<{
  fields: BasicField[];
  rootFields?: BasicField[];
  parentFields?: BasicField[];
  locale: Locale;
  onChange: (fields: BasicField[]) => void;
}>) => {
  const t = fieldCopy(locale);
  const [ids, setIds] = useState(() => fields.map(() => crypto.randomUUID()));
  const [preview, setPreview] = useState<ReturnType<
    typeof fieldDefinition
  > | null>(null);
  const onChange = (next: BasicField[]) => {
    setPreview(null);
    onFieldsChange(next);
  };
  const valid = fieldsSchema.safeParse(fields).success;
  const move = (index: number, direction: number) => {
    const next = [...fields],
      keys = [...ids];
    const other = index + direction;
    [next[index], next[other]] = [next[other], next[index]];
    [keys[index], keys[other]] = [keys[other], keys[index]];
    setIds(keys);
    onChange(next);
  };
  const update = (index: number, field: BasicField) => {
    onChange(fields.map((item, i) => (i === index ? field : item)));
  };
  const remove = (index: number) => {
    setIds(ids.filter((_, i) => i !== index));
    onChange(fields.filter((_, i) => i !== index));
  };
  const add = () => {
    setIds([...ids, crypto.randomUUID()]);
    onChange([
      ...fields,
      {
        key: `tmp_${crypto.randomUUID().replaceAll("-", "")}`,
        label: uiCopy(locale).newField,
        input: "text",
        dataType: "string",
        required: false,
      },
    ]);
  };
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <FieldEditor
          key={ids[index]}
          field={field}
          index={index}
          count={fields.length}
          conditionFields={{
            root: (rootFields ?? fields).filter((item) => item !== field),
            row: fields.filter((item) => item !== field),
            parent: (parentFields ?? fields).filter((item) => item !== field),
          }}
          rootFields={rootFields ?? fields}
          parentFields={fields}
          locale={locale}
          onChange={(next) => update(index, next)}
          onMove={(direction) => move(index, direction)}
          onRemove={() => remove(index)}
        />
      ))}
      {!valid && <p role="alert">{fields.length ? t.invalid : t.empty}</p>}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={fields.length >= 50}
          onClick={add}
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
          className="rounded-lg border border-line p-4"
        >
          <h3>{t.preview}</h3>
          <DynamicForm
            key={JSON.stringify(preview)}
            definition={preview}
            fields={fields}
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
};
