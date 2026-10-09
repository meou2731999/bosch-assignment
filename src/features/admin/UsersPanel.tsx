import { useEffect, useState, type FormEvent } from "react";
import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { adminApi } from "../auth/api";
import { authCopy } from "../auth/copy";
import { inputClass } from "../auth/AuthScreen";
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
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<AccountUser | "new" | null>(null);
  const [resetting, setResetting] = useState<AccountUser | null>(null);
  useEffect(() => {
    let live = true;
    adminApi
      .list()
      .then((next) => {
        if (live) setUsers(next);
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
      setNotice(message);
      if (next.id === userId) await onSelfChanged();
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
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
  const existing = editing && editing !== "new" ? editing : undefined;
  return (
    <main id="main" className="tw:mx-auto tw:max-w-6xl tw:p-5 tw:md:p-10">
      <div className="tw:mb-6 tw:flex tw:items-center tw:justify-between">
        <h1 className="tw:text-2xl tw:font-semibold">{t.users}</h1>
        <Button
          disabled={busy || loading}
          onClick={() => {
            setEditing("new");
            setResetting(null);
            setError(null);
            setNotice("");
          }}
        >
          {t.create}
        </Button>
      </div>
      {error && <ErrorNotice error={error} locale={locale} />}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">{t.working}</p>
      ) : (
        <div className="tw:overflow-x-auto tw:rounded-xl tw:border tw:border-line tw:bg-white">
          <table className="tw:w-full tw:text-left tw:text-sm tw:[&_td]:border-t tw:[&_td]:border-line tw:[&_td]:p-4 tw:[&_th]:p-4">
            <caption className="tw:sr-only">{t.users}</caption>
            <thead>
              <tr>
                <th>{t.name}</th>
                <th>{t.email}</th>
                <th>{t.role}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.name}
                    <small className="tw:block tw:text-muted">
                      {user.department}
                    </small>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {t[user.role]}
                    {user.isAdmin && ` · ${t.admin}`}
                  </td>
                  <td>{user.active ? t.active : t.disabled}</td>
                  <td>
                    <div className="tw:flex tw:flex-wrap tw:gap-2">
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditing(user);
                          setResetting(null);
                          setError(null);
                          setNotice("");
                        }}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setResetting(user);
                          setEditing(null);
                          setError(null);
                          setNotice("");
                        }}
                      >
                        {t.reset}
                      </Button>
                      <Button
                        variant={user.active ? "danger" : "secondary"}
                        disabled={busy}
                        onClick={() => {
                          if (!user.active || window.confirm(t.confirmDisable))
                            void act(
                              () =>
                                adminApi.edit(user.id, {
                                  active: !user.active,
                                }),
                              t.saved,
                            );
                        }}
                      >
                        {user.active ? t.disable : t.enable}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <section
          className="tw:mt-6 tw:max-w-xl tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-6"
          aria-label={existing ? t.edit : t.create}
        >
          <h2>{existing ? t.edit : t.create}</h2>
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
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  {t.cancel}
                </Button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
      {resetting && (
        <section
          aria-label={t.reset}
          className="tw:mt-6 tw:max-w-xl tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-6"
        >
          <h2>
            {t.reset}: {resetting.name}
          </h2>
          <p>{t.resetHint}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const password = String(
                new FormData(event.currentTarget).get("password"),
              );
              if (window.confirm(t.confirmReset))
                void act(
                  () => adminApi.reset(resetting.id, password),
                  t.resetDone,
                );
            }}
          >
            <fieldset
              disabled={busy}
              className="tw:space-y-4 tw:border-0 tw:p-0"
            >
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
              <div className="tw:flex tw:gap-3">
                <Button type="submit">{busy ? t.working : t.reset}</Button>
                <Button variant="secondary" onClick={() => setResetting(null)}>
                  {t.cancel}
                </Button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
    </main>
  );
}
