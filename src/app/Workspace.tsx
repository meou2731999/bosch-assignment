import { useWorkspace } from "./useWorkspace";
import { formCopy } from "../features/forms/copy";

import { AppHeader } from "./AppHeader";
import { RequestList } from "../features/requests/components/RequestList";

import { type Locale, type AccountUser } from "../../shared/model";

import { copy } from "../i18n";
import { RequestEditor } from "../features/requests/components/RequestEditor";
import { Status } from "../features/requests/components/Status";

export function Workspace({
  user,
  locale,
  setLocale,
  onLogout,
  onManage,
  onForms,
  onPassword,
}: Readonly<{
  user: AccountUser;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  onLogout: () => void;
  onManage: () => void;
  onForms: () => void;
  onPassword: () => void;
}>) {
  const t = copy(locale);
  const f = formCopy(locale);
  const {
    forms,
    requests,
    record,
    definition,
    loading,
    error,
    notice,
    dirty,
    busy,
    generation,
    load,
    setDirty,
    setBusy,
    canLeave,
    navigate,
    saved,
  } = useWorkspace(user, locale);
  function renderContent() {
    if (loading)
      return (
        <output
          className="tw:rounded-xl tw:border tw:border-line tw:bg-white tw:px-7 tw:py-16 tw:text-center tw:text-muted"
        >
          {t.loading}
        </output>
      );
    if (error)
      return (
        <div
          className="tw:mb-5 tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:px-5 tw:py-4 tw:text-sm tw:text-red-900 tw:[&_p]:my-2 tw:[&_ul]:mb-0"
          role="alert"
        >
          {error}{" "}
          <button
            className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:border-slate-300 tw:bg-white tw:text-brand tw:hover:bg-sage"
            onClick={() => void load(record?.id, true)}
          >
            {t.retry}
          </button>
        </div>
      );
    if (definition)
      return (
        <RequestEditor
          key={`${record?.id ?? "new"}-${record?.revision ?? 0}-${definition.formId}-${definition.version}-${generation.current}`}
          user={user}
          locale={locale}
          definition={definition}
          record={record}
          onDirty={setDirty}
          onBusy={setBusy}
          onSaved={saved}
          reload={() => navigate(record?.id)}
        />
      );
    return (
      <div className="tw:rounded-xl tw:border tw:border-line tw:bg-white tw:px-7 tw:py-16 tw:text-center tw:text-muted">
        {forms.some((form) => form.permissions.includes("create")) ||
        requests.length
          ? t.selectHint
          : f.noCreate}
      </div>
    );
  }
  const canCreate = forms.some((form) => form.permissions.includes("create"));
  const defaultTitle = canCreate ? t.newRequest : t.allRequests;
  const title = record
    ? String(record.data.requestTitle || t.untitled)
    : defaultTitle;

  return (
    <div className="tw:min-h-screen tw:bg-canvas tw:font-sans tw:text-[15px] tw:text-ink">
      <AppHeader
        user={user}
        locale={locale}
        busy={busy}
        loading={loading}
        setLocale={setLocale}
        onLogout={() => {
          if (canLeave()) onLogout();
        }}
        onManage={() => {
          if (canLeave()) onManage();
        }}
        onForms={() => {
          if (canLeave()) onForms();
        }}
        onPassword={() => {
          if (canLeave()) onPassword();
        }}
      />
      <div className="tw:flex tw:justify-between tw:gap-3 tw:bg-sage tw:px-5 tw:py-2 tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-muted tw:md:px-[5vw] tw:[&_span]:font-normal tw:[&_span]:tracking-normal">
        {t.demo}
        <span>
          {user.department} / {t[user.role]}
        </span>
      </div>
      <div className="tw:mx-auto tw:grid tw:min-h-[75vh] tw:max-w-[1380px] tw:gap-7 tw:px-4 tw:py-8 tw:md:grid-cols-[230px_minmax(0,1fr)] tw:md:gap-10 tw:md:px-[5vw] tw:md:py-10">
        <RequestList
          user={user}
          canCreate={canCreate}
          locale={locale}
          requests={requests}
          selectedId={record?.id}
          busy={busy}
          loading={loading}
          navigate={navigate}
        />
        <main id="main" className="tw:min-w-0">
          <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-5 tw:[&_h1]:mb-0 tw:[&_h1]:text-2xl tw:[&_h1]:font-semibold tw:[&_h1]:tracking-tight tw:md:[&_h1]:text-3xl">
            <div>
              <div className="tw:mb-3 tw:text-[10px] tw:font-bold tw:tracking-[0.16em] tw:text-muted">
                IT SERVICES
              </div>
              <h1>{title}</h1>
            </div>
            {record && <Status status={record.status} locale={locale} />}
          </div>
          <p className="tw:mb-6 tw:max-w-xl tw:text-sm tw:leading-relaxed tw:text-muted">
            {user.role === "reviewer" ? t.reviewHint : t.introduction}
          </p>
          {notice && !dirty && (
            <output className="tw:mb-5 tw:rounded-lg tw:border tw:border-green-200 tw:bg-green-50 tw:px-5 tw:py-4 tw:text-sm tw:text-green-900">
              ✓ {t[notice]}
            </output>
          )}
          {!record && canCreate && (
            <label className="tw:mb-5 tw:block tw:text-sm">
              {f.select}
              <select
                aria-label={f.select}
                className="tw:ml-3 tw:rounded-lg tw:border tw:border-line tw:bg-white tw:p-2"
                value={definition?.formId ?? ""}
                disabled={busy || loading}
                onChange={(event) => {
                  if (canLeave())
                    void load(undefined, false, event.target.value);
                }}
              >
                {forms
                  .filter((form) => form.permissions.includes("create"))
                  .map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {renderContent()}
        </main>
      </div>
      <footer className="tw:border-t tw:border-line tw:px-5 tw:py-5 tw:text-center tw:text-xs tw:text-muted">
        {t.local}
      </footer>
    </div>
  );
}
