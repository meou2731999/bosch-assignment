import { useCallback, useEffect, useRef, useState } from 'react';
import type { Webform } from '@formio/js';
import { USERS, type Attachment, type Locale, type RequestData, type RequestRecord, type User } from '../shared/model';
import { api, HttpError, type Definition } from './api';
import { copy } from './i18n';
import { DynamicForm } from './DynamicForm';

export function App() {
  const [user, setUser] = useState(USERS[0]);
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <Workspace key={user.id} user={user} locale={locale} setLocale={setLocale} setUser={setUser} />;
}

function Workspace({ user, locale, setLocale, setUser }: {
  user: User; locale: Locale; setLocale: (locale: Locale) => void; setUser: (user: User) => void;
}) {
  const t = copy(locale);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<'saved' | 'sent' | ''>('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const load = useCallback(async (id?: string, refreshList = false) => {
    const token = ++generation.current;
    setLoading(true); setError(''); setNotice(''); setDirty(false);
    try {
      const [list, next] = await Promise.all([
        refreshList ? api.list(user) : Promise.resolve(null),
        id ? api.get(user, id) : Promise.resolve(null),
      ]);
      const form = await api.form(user, next?.formVersion);
      if (generation.current !== token) return;
      if (list) setRequests(list);
      setRecord(next); setDefinition(form);
    } catch (e) {
      if (generation.current === token) { setError((e as Error).message); setDefinition(null); }
    } finally { if (generation.current === token) setLoading(false); }
  }, [user]);
  useEffect(() => { void load(undefined, true); return () => { generation.current++; }; }, [load]);
  useEffect(() => {
    const protect = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  function canLeave() { return !dirty || window.confirm(t.discard); }
  function navigate(id?: string) { if (!busy && canLeave()) void load(id); }
  function saved(next: RequestRecord) {
    setRecord(next); setDirty(false);
    setRequests(current => [next, ...current.filter(r => r.id !== next.id)]);
    setNotice(next.status === 'draft' ? 'saved' : 'sent');
  }
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">R</span><span>Request Desk<small>{t.tagline}</small></span></a>
      <div className="session-controls">
        <label>{t.identity}<select value={user.id} disabled={busy || loading} onChange={e => {
          if (canLeave()) setUser(USERS.find(u => u.id === e.target.value)!);
        }}>{USERS.map(u => <option key={u.id} value={u.id}>{u.name} · {t[u.role]}</option>)}</select></label>
        <label>{t.language}<select value={locale} disabled={busy} onChange={e => setLocale(e.target.value as Locale)}>
          <option value="en">English</option><option value="vi">Tiếng Việt</option>
        </select></label>
      </div>
    </header>
    <div className="demo-strip">{t.demo}<span>{user.department} / {t[user.role]}</span></div>
    <div className="workspace">
      <aside className="sidebar" aria-label={t.requests}>
        <div className="section-eyebrow">WORKSPACE</div>
        <div className="sidebar-title"><h2>{user.role === 'reviewer' ? t.allRequests : t.requests}</h2><span>{requests.length}</span></div>
        {user.role === 'requester' && <button className="button button-primary new-button" disabled={loading || busy} onClick={() => navigate()}><span aria-hidden="true">＋</span> {t.newRequest}</button>}
        <nav className="request-list" aria-label={t.requests}>
          {!loading && !requests.length && <p className="muted">{t.empty}</p>}
          {requests.map(r => <button key={r.id} className={`request-item ${r.id === record?.id ? 'selected' : ''}`}
            aria-current={r.id === record?.id ? 'page' : undefined} disabled={busy || loading} onClick={() => navigate(r.id)}>
            <Status status={r.status} locale={locale} /><strong>{r.data.requestTitle || t.untitled}</strong>
            <small>{new Date(r.updatedAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')} · v{r.formVersion}</small>
          </button>)}
        </nav>
        <div className="sidebar-note"><span aria-hidden="true">↳</span> {user.role === 'reviewer' ? t.reviewHint : t.help}</div>
      </aside>
      <main id="main" className="main-content">
        <div className="page-heading"><div><div className="section-eyebrow">IT SERVICES</div><h1>{record ? record.data.requestTitle || t.untitled : user.role === 'requester' ? t.newRequest : t.allRequests}</h1></div>
          {record && <Status status={record.status} locale={locale} />}</div>
        <p className="page-description">{user.role === 'reviewer' ? t.reviewHint : t.introduction}</p>
        {notice && !dirty && <div className="notice success" role="status">✓ {t[notice]}</div>}
        {loading ? <div className="surface loading" role="status">{t.loading}</div> : error ? <div className="notice error" role="alert">{error} <button className="button button-secondary" onClick={() => void load(record?.id, true)}>{t.retry}</button></div> : definition && (user.role === 'requester' || record) ?
          <RequestEditor key={`${record?.id ?? 'new'}-${record?.revision ?? 0}-${definition.version}-${generation.current}`} user={user} locale={locale} definition={definition} record={record}
            onDirty={setDirty} onBusy={setBusy} onSaved={saved} reload={() => navigate(record?.id)} /> : <div className="surface empty-state">{t.selectHint}</div>}
      </main>
    </div>
    <footer>{t.local}</footer>
  </div>;
}

function Status({ status, locale }: { status: RequestRecord['status']; locale: Locale }) {
  return <span className={`status status-${status}`}><span aria-hidden="true">●</span> {copy(locale)[status]}</span>;
}

function RequestEditor({ user, locale, definition, record, onDirty, onBusy, onSaved, reload }: {
  user: User; locale: Locale; definition: Definition; record: RequestRecord | null;
  onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void;
  onSaved: (record: RequestRecord) => void; reload: () => void;
}) {
  const t = copy(locale);
  const readOnly = user.role !== 'requester' || (!!record && record.status !== 'draft');
  const [id] = useState(() => record?.id ?? crypto.randomUUID());
  const [initialData] = useState(() => record?.data ?? {});
  const [attachments, setAttachments] = useState<Attachment[]>(record?.attachments ?? []);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fail, setFail] = useState(false);
  const [error, setError] = useState<HttpError | Error | null>(null);
  const form = useRef<Webform | null>(null);
  const errorBox = useRef<HTMLDivElement | null>(null);
  const onReady = useCallback((instance: Webform) => { form.current = instance; setReady(true); }, []);
  const markDirty = useCallback(() => { setDirty(true); onDirty(true); }, [onDirty]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);

  async function save(action: 'draft' | 'submit') {
    if (!form.current || saving || readOnly) return;
    setError(null); setSaving(true); onBusy(true);
    try {
      let data = (form.current.submission as { data: RequestData }).data;
      if (action === 'submit') {
        try {
          // Raw JSON uses Form.io's local validation path; our API owns persistence.
          const submission = await form.current.submit(false, { state: 'submitted' });
          data = (submission as { data: RequestData }).data;
        } catch { throw new HttpError('CLIENT_VALIDATION', t.validation); }
      }
      const simulateFailure = fail;
      setFail(false);
      const next = await api.save(user, id, { revision: record?.revision ?? 0, formVersion: definition.version, action, data, attachments }, simulateFailure);
      onSaved(next);
    } catch (e) { setError(e as Error); }
    finally { setSaving(false); onBusy(false); }
  }
  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = [...attachments, ...Array.from(files, f => ({ name: f.name, size: f.size, type: f.type }))];
    const types = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    if (next.length > 3 || next.some(f => f.size <= 0 || f.size > 5 * 1024 * 1024 || f.name.length > 120 || !types.includes(f.type))) {
      setError(new Error(t.fileError)); return;
    }
    setError(null); setAttachments(next); markDirty();
  }
  const fields = error instanceof HttpError ? Object.entries(error.fields) : [];
  return <>
    <section className="surface editor" aria-label={t.newRequest}>
      <div className="editor-meta"><span>{t.version} <strong>{definition.version}</strong></span><span>{t.revision} <strong>{record?.revision ?? 0}</strong></span>
        <span className="owner">{t.requestOwner} <strong>{USERS.find(u => u.id === record?.ownerId)?.name ?? user.name}</strong></span></div>
      {readOnly && <div className="read-only-note">{t.readonly}</div>}
      {error && <div className="notice error" role="alert" tabIndex={-1} ref={errorBox}><strong>{t.errorTitle}</strong><p>{error.message}</p>
        {!!fields.length && <ul>{fields.map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul>}
        {error instanceof HttpError && ['CONFLICT', 'LOCKED', 'VERSION'].includes(error.code) && <><p>{t.reloadHint}</p><button className="button button-secondary" onClick={reload}>{t.back}</button></>}
      </div>}
      <fieldset disabled={saving} className="form-fields">
        <DynamicForm definition={definition.definition} initialData={initialData} readOnly={readOnly} locale={locale} onReady={onReady} onDirty={markDirty} />
        <div className="attachment-area"><h2>{t.attachments}</h2><p id="file-help" className="muted">{t.fileHint}</p>
          {!readOnly && <input aria-label={t.attachments} aria-describedby="file-help" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />}
          {!attachments.length && <p className="no-files">{t.noFiles}</p>}
          <ul className="attachment-list">{attachments.map((f, index) => <li key={`${f.name}-${index}`}><span>{f.name} <small>({Math.ceil(f.size / 1024)} KB)</small></span>
            {!readOnly && <button className="text-button" aria-label={`${t.remove} ${f.name}`} onClick={() => { setAttachments(attachments.filter((_, i) => i !== index)); markDirty(); }}>{t.remove}</button>}</li>)}</ul>
        </div>
      </fieldset>
      {!readOnly && <div className="form-actions"><span className="save-indicator" role="status">{saving ? t.saving : dirty ? t.dirty : t.help}</span><div>
        <button className="button button-secondary" disabled={!ready || saving} onClick={() => void save('draft')}>{t.saveDraft}</button>
        <button className="button button-primary" disabled={!ready || saving} onClick={() => void save('submit')}>{t.submit} <span aria-hidden="true">↗</span></button>
      </div></div>}
    </section>
    {!readOnly && <details className="demo-controls"><summary>{t.demoTools}</summary><label><input type="checkbox" checked={fail} disabled={saving} onChange={e => setFail(e.target.checked)} /> {t.fail}</label></details>}
    {record && <section className="activity" aria-label={t.history}><h2>{t.history}</h2><ol>{[...record.audit].reverse().map((event, i) => <li key={i}><span className="activity-dot" aria-hidden="true" /><div><strong>{t[event.action]}</strong><span>{USERS.find(u => u.id === event.actorId)?.name ?? event.actorId}</span></div><time dateTime={event.at}>{new Date(event.at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-GB')}</time></li>)}</ol></section>}
  </>;
}
