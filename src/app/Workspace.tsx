import { Button } from "../components/ui/Button";
import type { ChangeEvent } from "react";
import { useWorkspace } from "./useWorkspace";
import { formCopy } from "../features/forms/copy";

import { AppHeader } from "./AppHeader";
import { RequestList } from "../features/requests/components/RequestList";

import { type Locale, type AccountUser } from "../../shared/model";

import { copy } from "../i18n";
import { RequestEditor } from "../features/requests/components/RequestEditor";
import { Status } from "../features/requests/components/Status";

export const Workspace = ({
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
}>) => {
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
  const renderContent = () => {
    if (loading)
      return (
        <output className="block rounded-xl border border-line bg-white px-7 py-16 text-center text-muted">
          {t.loading}
        </output>
      );
    if (error)
      return (
        <div
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 [&_p]:my-2 [&_ul]:mb-0"
          role="alert"
        >
          {error}{" "}
          <Button
            variant="secondary"
            onClick={() => void load(record?.id, true)}
          >
            {t.retry}
          </Button>
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
      <div className="block rounded-xl border border-line bg-white px-7 py-16 text-center text-muted">
        {forms.some((form) => form.permissions.includes("create")) ||
        requests.length
          ? t.selectHint
          : f.noCreate}
      </div>
    );
  };
  const canCreate = forms.some((form) => form.permissions.includes("create"));
  const defaultTitle = canCreate ? t.newRequest : t.allRequests;
  const title = record
    ? String(record.data.requestTitle || t.untitled)
    : defaultTitle;
  const leaveFor = (action: () => void) => {
    if (canLeave()) action();
  };
  const changeForm = (event: ChangeEvent<HTMLSelectElement>) => {
    if (canLeave()) void load(undefined, false, event.target.value);
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-[15px] text-ink">
      <AppHeader
        user={user}
        locale={locale}
        busy={busy}
        loading={loading}
        setLocale={setLocale}
        onLogout={() => leaveFor(onLogout)}
        onManage={() => leaveFor(onManage)}
        onForms={() => leaveFor(onForms)}
        onPassword={() => leaveFor(onPassword)}
      />
      <div className="flex justify-between gap-3 bg-sage px-5 py-2 text-[10px] font-semibold tracking-wider text-muted md:px-[5vw] [&_span]:font-normal [&_span]:tracking-normal">
        {t.demo}
        <span>
          {user.department} / {t[user.role]}
        </span>
      </div>
      <div className="mx-auto grid min-h-[75vh] max-w-[1380px] gap-7 px-4 py-8 md:grid-cols-[230px_minmax(0,1fr)] md:gap-10 md:px-[5vw] md:py-10">
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
        <main id="main" className="min-w-0">
          <div className="mb-3 flex items-start justify-between gap-5 [&_h1]:mb-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight md:[&_h1]:text-3xl">
            <div>
              <div className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted">
                IT SERVICES
              </div>
              <h1>{title}</h1>
            </div>
            {record && <Status status={record.status} locale={locale} />}
          </div>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted">
            {user.role === "reviewer" ? t.reviewHint : t.introduction}
          </p>
          {notice && !dirty && (
            <output className="mb-5 block rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
              ✓ {t[notice]}
            </output>
          )}
          {!record && canCreate && (
            <label className="mb-5 flex flex-wrap items-center gap-3 text-sm">
              {f.select}
              <select
                aria-label={f.select}
                className="ui-field mt-0 w-auto py-2"
                value={definition?.formId ?? ""}
                disabled={busy || loading}
                onChange={changeForm}
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
      <footer className="border-t border-line px-5 py-5 text-center text-xs text-muted">
        {t.local}
      </footer>
    </div>
  );
};
