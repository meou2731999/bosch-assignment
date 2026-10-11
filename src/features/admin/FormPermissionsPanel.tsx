import { useState, type FormEvent } from "react";
import type { FormRecord, FormPermissions } from "../../../shared/forms";
import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { formsApi } from "../forms/api";
import { formCopy } from "../forms/copy";
export function FormPermissionsPanel({
  user,
  forms,
  locale,
  busy,
  onSave,
  onCancel,
}: {
  user: AccountUser;
  forms: FormRecord[];
  locale: Locale;
  busy: boolean;
  onSave: (
    operation: () => Promise<AccountUser>,
    message: string,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const t = formCopy(locale);
  const [permissions, setPermissions] = useState<FormPermissions>(
    structuredClone(user.formPermissions),
  );
  function toggle(
    formId: string,
    permission: "create" | "view" | "review",
    checked: boolean,
  ) {
    setPermissions((current) => {
      const previous = current[formId] ?? [];
      return {
        ...current,
        [formId]: checked
          ? [...previous, permission]
          : previous.filter((value) => value !== permission),
      };
    });
  }
  function save(event: FormEvent) {
    event.preventDefault();
    void onSave(
      () => formsApi.permissions(user.id, user.permissionRevision, permissions),
      t.grantSaved,
    );
  }
  return (
    <section aria-label={t.permissions} className="tw:space-y-4">
      <p className="tw:font-semibold">{user.name}</p>
      <p>{t.permissionHint}</p>
      <form onSubmit={save}>
        <fieldset disabled={busy} className="tw:space-y-4 tw:border-0 tw:p-0">
          {forms.map((form) => (
            <fieldset
              key={form.id}
              className="tw:rounded-lg tw:border tw:border-line tw:p-4"
            >
              <legend className="tw:text-base">
                {form.draft.name} ·{" "}
                {form.activeVersion ? `v${form.activeVersion}` : t.unpublished}
              </legend>
              <div className="tw:flex tw:flex-wrap tw:gap-5">
                {(["create", "view", "review"] as const).map((permission) => {
                  const labels = {
                    create: t.grantCreate,
                    view: t.grantView,
                    review: t.grantReview,
                  };
                  return (
                    <label key={permission}>
                      <input
                        type="checkbox"
                        checked={(permissions[form.id] ?? []).includes(
                          permission,
                        )}
                        onChange={(event) =>
                          toggle(form.id, permission, event.target.checked)
                        }
                      />{" "}
                      {labels[permission]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="tw:flex tw:gap-3">
            <Button type="submit">{busy ? t.working : t.grantSave}</Button>
            <Button variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
