import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountUser, RequestRecord, Locale } from "../../../shared/model";
import type { FormSummary } from "../../../shared/forms";
import { formsApi } from "../forms/api";
import { api, type Definition } from "./api";
import { copy } from "../../i18n";
const readPage = () => {
  const match = /^\/requests\/([^/]+)$/.exec(window.location.pathname);
  return match ? decodeURIComponent(match[1]) : "list";
};
const pagePath = (page: string) =>
  page === "list" ? "/requests" : `/requests/${encodeURIComponent(page)}`;

export function useWorkspace(user: AccountUser, locale: Locale) {
  const t = copy(locale);
  const [page, setPage] = useState(readPage);
  const navigationGuard = useRef<() => boolean>(() => true);
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [record, setRecord] = useState<RequestRecord | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<
    "saved" | "sent" | "approvedMessage" | "rejectedMessage" | ""
  >("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const historyIndex = useRef(0);
  const load = useCallback(
    async (id = "new", refreshList = false, chosenFormId?: string) => {
      const token = ++generation.current;
      setLoading(true);
      setError("");
      setNotice("");
      setDirty(false);
      setRecord(null);
      setDefinition(null);
      try {
        const [list, next, catalog] = await Promise.all([
          refreshList ? api.list(user) : Promise.resolve(null),
          id !== "list" && id !== "new"
            ? api.get(user, id)
            : Promise.resolve(null),
          formsApi.catalog(),
        ]);
        const selectedForm =
          next?.formId ??
          chosenFormId ??
          catalog.find((form) => form.permissions.includes("create"))?.id;
        const form =
          selectedForm && id !== "list"
            ? await api.form(user, selectedForm, next?.formVersion)
            : null;
        if (generation.current !== token) return;
        setForms(catalog);
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
    const requestGeneration = generation;
    const initialPage = readPage();
    setPage(initialPage);
    historyIndex.current = window.history.state?.requestIndex ?? 0;
    window.history.replaceState(
      { requestIndex: historyIndex.current },
      "",
      pagePath(initialPage),
    );
    let restoring = false;
    void load(initialPage, true);
    const onPopState = (event: PopStateEvent) => {
      if (restoring) {
        restoring = false;
        return;
      }
      const nextIndex = event.state?.requestIndex ?? 0;
      if (nextIndex === historyIndex.current) return;
      if (!navigationGuard.current()) {
        restoring = true;
        window.history.go(historyIndex.current - nextIndex);
        return;
      }
      historyIndex.current = nextIndex;
      const next = readPage();
      setPage(next);
      void load(next, true);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      requestGeneration.current++;
      window.removeEventListener("popstate", onPopState);
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
  navigationGuard.current = () => !busy && canLeave();
  function navigate(id = "new") {
    if (busy || !canLeave()) return;
    window.history.pushState(
      { requestIndex: ++historyIndex.current },
      "",
      pagePath(id),
    );
    setPage(id);
    void load(id, id === "list");
  }
  function saved(next: RequestRecord, nextDefinition?: Definition) {
    if (nextDefinition) setDefinition(nextDefinition);
    window.history.replaceState(
      { requestIndex: historyIndex.current },
      "",
      pagePath(next.id),
    );
    setPage(next.id);
    setRecord(next);
    setDirty(false);
    setRequests((current) => [
      next,
      ...current.filter((r) => r.id !== next.id),
    ]);
    const notices = {
      approved: "approvedMessage",
      rejected: "rejectedMessage",
      draft: "saved",
      submitted: "sent",
      in_review: "sent",
    } as const;
    setNotice(notices[next.status]);
  }
  function reviewed(next: RequestRecord) {
    setRequests((current) => [
      next,
      ...current.filter((request) => request.id !== next.id),
    ]);
    setNotice(
      next.status === "approved" ? "approvedMessage" : "rejectedMessage",
    );
  }
  return {
    state: {
      page,
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
    },
    actions: {
      load,
      setDirty,
      setBusy,
      canLeave,
      navigate,
      saved,
      reviewed,
    },
  };
}
