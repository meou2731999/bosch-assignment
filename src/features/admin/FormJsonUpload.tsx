import { useState, type ChangeEvent } from "react";
import {
  importFormDefinition,
  MAX_FORM_FILE_BYTES,
} from "../../../shared/form-import";
import type { FormDefinition } from "../../../shared/forms";
import type { Locale } from "../../../shared/model";
import { inputClass } from "../auth/AuthScreen";
export const FormJsonUpload = ({
  locale,
  onImport,
  onLoading,
}: Readonly<{
  locale: Locale;
  onImport: (definition: FormDefinition) => void;
  onLoading: (loading: boolean) => void;
}>) => {
  const [error, setError] = useState("");
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    onLoading(true);
    try {
      if (
        !file.name.toLowerCase().endsWith(".json") ||
        file.size > MAX_FORM_FILE_BYTES
      )
        throw new Error("file");
      const imported = importFormDefinition(JSON.parse(await file.text()));
      onImport(imported.definition);
    } catch {
      setError(
        locale === "vi"
          ? "Không thể nhập tệp. Chọn JSON Form.io hợp lệ (tối đa 256 KB) với các thành phần được hỗ trợ. Biểu mẫu hiện tại chưa bị thay đổi."
          : "Could not import file. Choose valid Form.io JSON (up to 256 KB) with supported components. Your current form has not changed.",
      );
    } finally {
      onLoading(false);
    }
  };
  return (
    <div>
      <label>
        {locale === "vi" ? "Tải lên JSON Form.io" : "Upload Form.io JSON"}
        <input
          className={inputClass}
          type="file"
          accept=".json,application/json"
          onChange={upload}
          aria-describedby="form-json-hint"
        />
      </label>
      <p id="form-json-hint" className="text-muted">
        {locale === "vi"
          ? "Hỗ trợ textfield, textarea, email, number, checkbox, select, radio, panel và fieldset; lựa chọn tĩnh và điều kiện đơn giản. Tải lên sẽ thay thế nội dung bản nháp trong trình sửa."
          : "Supports textfield, textarea, email, number, checkbox, select, radio, panel and fieldset; static choices and simple conditions. Uploading replaces the draft content in this editor."}
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
