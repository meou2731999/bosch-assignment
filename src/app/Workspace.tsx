import { AppHeader } from "./AppHeader";
import { RequestList } from "../features/requests/components/RequestList";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  USERS,
  type Locale,
  type RequestRecord,
  type User,
} from "../../shared/model";
import { api, type Definition } from "../features/requests/api";
import { copy } from "../i18n";
import { RequestEditor } from "../features/requests/components/RequestEditor";
import { Status } from "../features/requests/components/Status";

export function Workspace({
  user,
  locale,
  setLocale,
  setUser,
}: {
  user: User;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  setUser: (user: User) => void;
}) {
  const t = copy(locale);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "sent" | "">("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const load = useCallback(
    async (id?: string, refreshList = false) => {
      const token = ++generation.current;
      setLoading(true);
      setError("");
      setNotice("");
      setDirty(false);
      try {
        const [list, next] = await Promise.all([
          refreshList ? api.list(user) : Promise.resolve(null),
          id ? api.get(user, id) : Promise.resolve(null),
        ]);
        const form = await api.form(user, next?.formVersion);
        if (generation.current !== token) return;
        if (list) setRequests(list);
        setRecord(next);
        setDefinition(form);
      } catch (e) {
        if (generation.current === token) {
          setError((e as Error).message);
          setDefinition(null);
        }
      } finally {
        if (generation.current === token) setLoading(false);
      }
    },
    [user],
  );
  useEffect(() => {
    void load(undefined, true);
    return () => {
      generation.current++;
    };
  }, [load]);
  useEffect(() => {
    const protect = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  function canLeave() {
    return !dirty || window.confirm(t.discard);
  }
  function navigate(id?: string) {
    if (!busy && canLeave()) void load(id);
  }
  function saved(next: RequestRecord) {
    setRecord(next);
    setDirty(false);
    setRequests((current) => [
      next,
      ...current.filter((r) => r.id !== next.id),
    ]);
    setNotice(next.status === "draft" ? "saved" : "sent");
  }
  return (
    <div className="tw:min-h-screen tw:bg-canvas tw:font-sans tw:text-[15px] tw:text-ink">
      <AppHeader
        user={user}
        locale={locale}
        busy={busy}
        loading={loading}
        setLocale={setLocale}
        onUserChange={(next) => {
          if (canLeave()) setUser(next);
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
              <h1>
                {record
                  ? record.data.requestTitle || t.untitled
                  : user.role === "requester"
                    ? t.newRequest
                    : t.allRequests}
              </h1>
            </div>
            {record && <Status status={record.status} locale={locale} />}
          </div>
          <p className="tw:mb-6 tw:max-w-xl tw:text-sm tw:leading-relaxed tw:text-muted">
            {user.role === "reviewer" ? t.reviewHint : t.introduction}
          </p>
          {notice && !dirty && (
            <div
              className="tw:mb-5 tw:rounded-lg tw:border tw:border-green-200 tw:bg-green-50 tw:px-5 tw:py-4 tw:text-sm tw:text-green-900"
              role="status"
            >
              ✓ {t[notice]}
            </div>
          )}
          {loading ? (
            <div
              className="tw:rounded-xl tw:border tw:border-line tw:bg-white tw:px-7 tw:py-16 tw:text-center tw:text-muted"
              role="status"
            >
              {t.loading}
            </div>
          ) : error ? (
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
          ) : definition && (user.role === "requester" || record) ? (
            <RequestEditor
              key={`${record?.id ?? "new"}-${record?.revision ?? 0}-${definition.version}-${generation.current}`}
              user={user}
              locale={locale}
              definition={definition}
              record={record}
              onDirty={setDirty}
              onBusy={setBusy}
              onSaved={saved}
              reload={() => navigate(record?.id)}
            />
          ) : (
            <div className="tw:rounded-xl tw:border tw:border-line tw:bg-white tw:px-7 tw:py-16 tw:text-center tw:text-muted">
              {t.selectHint}
            </div>
          )}
        </main>
      </div>
      <footer className="tw:border-t tw:border-line tw:px-5 tw:py-5 tw:text-center tw:text-xs tw:text-muted">
        {t.local}
      </footer>
    </div>
  );
}
