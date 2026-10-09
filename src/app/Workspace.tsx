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
    <div className="app-shell">
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
      <div className="demo-strip">
        {t.demo}
        <span>
          {user.department} / {t[user.role]}
        </span>
      </div>
      <div className="workspace">
        <RequestList
          user={user}
          locale={locale}
          requests={requests}
          selectedId={record?.id}
          busy={busy}
          loading={loading}
          navigate={navigate}
        />
        <main id="main" className="main-content">
          <div className="page-heading">
            <div>
              <div className="section-eyebrow">IT SERVICES</div>
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
          <p className="page-description">
            {user.role === "reviewer" ? t.reviewHint : t.introduction}
          </p>
          {notice && !dirty && (
            <div className="notice success" role="status">
              ✓ {t[notice]}
            </div>
          )}
          {loading ? (
            <div className="surface loading" role="status">
              {t.loading}
            </div>
          ) : error ? (
            <div className="notice error" role="alert">
              {error}{" "}
              <button
                className="button button-secondary"
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
            <div className="surface empty-state">{t.selectHint}</div>
          )}
        </main>
      </div>
      <footer>{t.local}</footer>
    </div>
  );
}
