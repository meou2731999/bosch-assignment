import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { authCopy } from "../auth/copy";
import type { FormEvent } from "react";
import { inputClass } from "../auth/AuthScreen";
export function UserEditor({
  editing,
  locale,
  busy,
  save,
  onCancel,
}: {
  editing: AccountUser | "new";
  locale: Locale;
  busy: boolean;
  save: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const t = authCopy(locale);
  const existing = editing !== "new" ? editing : undefined;
  return (
    <section className="tw:space-y-4" aria-label={existing ? t.edit : t.create}>
      <form
        key={typeof editing === "string" ? editing : editing.id}
        onSubmit={save}
      >
        <fieldset
          disabled={busy}
          className="tw:space-y-4 tw:border-0 tw:p-0 tw:[&_label]:block tw:[&_input]:mt-1"
        >
          <label>
            {t.name}
            <input
              className={inputClass}
              name="name"
              required
              maxLength={120}
              defaultValue={existing?.name}
            />
          </label>
          <label>
            {t.email}
            <input
              className={inputClass}
              type="email"
              name="email"
              required
              maxLength={254}
              defaultValue={existing?.email}
              autoComplete="off"
            />
          </label>
          <label>
            {t.department}
            <input
              className={inputClass}
              name="department"
              required
              maxLength={120}
              defaultValue={existing?.department}
            />
          </label>
          <label>
            {t.role}
            <select
              className={inputClass}
              name="role"
              defaultValue={existing?.role ?? "requester"}
            >
              <option value="requester">{t.requester}</option>
              <option value="reviewer">{t.reviewer}</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="isAdmin"
              defaultChecked={existing?.isAdmin}
            />{" "}
            {t.admin}
          </label>
          {!existing && (
            <label>
              {t.initialPassword}
              <input
                className={inputClass}
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
              />
            </label>
          )}
          <div className="tw:flex tw:gap-3">
            <Button type="submit">{busy ? t.working : t.save}</Button>
            <Button variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
