import { Modal } from "../../components/ui/Modal";
import { formCopy } from "../forms/copy";
import { UsersTable } from "./UsersTable";
import { UserEditor } from "./UserEditor";
import { ResetPasswordPanel } from "./ResetPasswordPanel";
import type { FormRecord } from "../../../shared/forms";
import { formsApi } from "../forms/api";
import { FormPermissionsPanel } from "./FormPermissionsPanel";
import { useEffect, useState, type FormEvent } from "react";
import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { adminApi } from "../auth/api";
import { authCopy } from "../auth/copy";

export function UsersPanel({
  locale,
  onSelfChanged,
  userId,
}: {
  locale: Locale;
  onSelfChanged: () => Promise<void>;
  userId: string;
}) {
  const t = authCopy(locale);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [granting, setGranting] = useState<AccountUser | null>(null);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<AccountUser | "new" | null>(null);
  const [resetting, setResetting] = useState<AccountUser | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([adminApi.list(), formsApi.all()])
      .then(([next, types]) => {
        if (live) {
          setUsers(next);
          setForms(types);
        }
      })
      .catch((error) => {
        if (live) setError(error);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function act(operation: () => Promise<AccountUser>, message: string) {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const next = await operation();
      setUsers((current) => [
        ...current.filter((user) => user.id !== next.id),
        next,
      ]);
      setEditing(null);
      setResetting(null);
      setGranting(null);
      setNotice(message);
      if (next.id === userId) await onSelfChanged();
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  function closeEditor() {
    setEditing(null);
    setResetting(null);
    setGranting(null);
    setError(null);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get("name")),
      email: String(data.get("email")),
      department: String(data.get("department")),
      role: String(data.get("role")),
      isAdmin: data.get("isAdmin") === "on",
    };
    const target = editing;
    void act(
      () =>
        target === "new"
          ? adminApi.create({
              ...input,
              password: String(data.get("password")),
            })
          : adminApi.edit((target as AccountUser).id, input),
      t.saved,
    );
  }

  let title = formCopy(locale).permissions;
  if (editing) title = editing === "new" ? t.create : t.edit;
  if (resetting) title = t.reset;
  return (
    <main id="main" className="tw:mx-auto tw:max-w-6xl tw:p-5 tw:md:p-10">
      <div className="tw:mb-6 tw:flex tw:items-center tw:justify-between">
        <h1 className="tw:text-2xl tw:font-semibold">{t.users}</h1>
        <Button
          disabled={busy || loading}
          onClick={() => {
            setGranting(null);
            setEditing("new");
            setResetting(null);
            setError(null);
            setNotice("");
          }}
        >
          {t.create}
        </Button>
      </div>
      {error && !editing && !resetting && !granting && (
        <ErrorNotice error={error} locale={locale} />
      )}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">{t.working}</p>
      ) : (
        <UsersTable
          users={users}
          locale={locale}
          busy={busy}
          onSelect={(mode, user) => {
            setGranting(mode === "permissions" ? user : null);
            setEditing(mode === "edit" ? user : null);
            setResetting(mode === "reset" ? user : null);
            setError(null);
            setNotice("");
          }}
          act={act}
        />
      )}
      {(editing || resetting || granting) && (
        <Modal
          title={title}
          locale={locale}
          busy={busy}
          wide={Boolean(granting)}
          onClose={closeEditor}
        >
          {error && <ErrorNotice error={error} locale={locale} />}
          {granting && (
            <FormPermissionsPanel
              key={granting.id}
              user={granting}
              forms={forms}
              locale={locale}
              busy={busy}
              onSave={act}
              onCancel={closeEditor}
            />
          )}
          {editing && (
            <UserEditor
              editing={editing}
              locale={locale}
              busy={busy}
              save={save}
              onCancel={closeEditor}
            />
          )}
          {resetting && (
            <ResetPasswordPanel
              resetting={resetting}
              locale={locale}
              busy={busy}
              act={act}
              onCancel={closeEditor}
            />
          )}
        </Modal>
      )}
    </main>
  );
}
