import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountUser, RequestRecord, Locale } from "../../shared/model";
import type { FormSummary } from "../../shared/forms";
import { formsApi } from "../features/forms/api";
import { api, type Definition } from "../features/requests/api";
import { copy } from "../i18n";
export function useWorkspace(user: AccountUser, locale: Locale) {
  const t = copy(locale);
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
  const load = useCallback(
    async (id?: string, refreshList = false, chosenFormId?: string) => {
      const token = ++generation.current;
      setLoading(true);
      setError("");
      setNotice("");
      setDirty(false);
      try {
        const [list, next, catalog] = await Promise.all([
          refreshList ? api.list(user) : Promise.resolve(null),
          id ? api.get(user, id) : Promise.resolve(null),
          formsApi.catalog(),
        ]);
        const selectedForm =
          next?.formId ??
          chosenFormId ??
          catalog.find((form) => form.permissions.includes("create"))?.id;
        const form = selectedForm
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
    void load(undefined, true);
    return () => {
      requestGeneration.current++;
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
  function saved(next: RequestRecord, nextDefinition?: Definition) {
    if (nextDefinition) setDefinition(nextDefinition);
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
  return {
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
  };
}
