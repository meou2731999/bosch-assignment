import { useEffect, useRef, useState } from "react";
import type { BasicField } from "../../../shared/fields";
import type { RequestData, Locale } from "../../../shared/model";
import type { FormHandle } from "./FormHandle";
import { FieldTree } from "./structured/FieldTree";
export function StructuredForm({
  fields,
  initialData,
  readOnly,
  locale,
  onReady,
  onDirty,
}: {
  fields: BasicField[];
  initialData: RequestData;
  readOnly: boolean;
  locale: Locale;
  onReady: (form: FormHandle) => void;
  onDirty: () => void;
}) {
  const [data, setData] = useState<Record<string, unknown>>(() =>
    structuredClone(initialData),
  );
  const handle = useRef<FormHandle>({
    submission: { data },
    submit: async (): Promise<unknown> => handle.current.submission,
  });
  useEffect(() => {
    onReady(handle.current);
  }, [onReady]);
  return (
    <div className="formio-surface">
      <FieldTree
        fields={fields}
        scope={{ root: data, row: data, parent: data }}
        readOnly={readOnly}
        locale={locale}
        onChange={(next) => {
          handle.current.submission = { data: next };
          setData(next);
          onDirty();
        }}
      />
    </div>
  );
}
