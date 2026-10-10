import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DraftPreview,
  SnapshotSummary,
} from "../../../../shared/draft-history";
import type { RequestRecord, User } from "../../../../shared/model";
import { api, HttpError, type Definition } from "../api";
import { historyApi } from "./api";
export function useDraftHistory({
  record,
  user,
  onBusy,
  onSaved,
}: {
  record: RequestRecord;
  user: User;
  onBusy: (busy: boolean) => void;
  onSaved: (record: RequestRecord, definition?: Definition) => void;
}) {
  const [latest, setLatest] = useState<Definition | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const [form, items] = await Promise.all([
        api.form(user, record.formId),
        historyApi.list(user, record.id),
      ]);
      if (token === generation.current) {
        setLatest(form);
        setSnapshots(items.filter((item) => item.revision !== record.revision));
      }
    } catch (cause) {
      if (token === generation.current) setError(cause as Error);
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }, [user, record]);
  useEffect(() => {
    const ref = generation;
    void refresh();
    return () => {
      ref.current++;
    };
  }, [refresh]);
  function cancel() {
    setPreview(null);
    setError(null);
    onBusy(false);
  }
  async function show(snapshotRevision?: number) {
    if (!latest || busy || loading) return;
    setError(null);
    setBusy(true);
    onBusy(true);
    try {
      setPreview(
        await historyApi.preview(
          user,
          record,
          snapshotRevision,
        )(latest.version),
      );
    } catch (cause) {
      setError(cause as Error);
      onBusy(false);
    } finally {
      setBusy(false);
    }
  }
  async function validate(data: Record<string, unknown>): Promise<boolean> {
    if (!preview || busy) return false;
    setError(null);
    setBusy(true);
    try {
      setPreview(
        await historyApi.preview(user, record)(preview.toVersion, data),
      );
      return true;
    } catch (cause) {
      invalidate(cause);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function invalidate(cause: unknown) {
    setError(cause as Error);
    if (
      cause instanceof HttpError &&
      ["CONFLICT", "VERSION", "LOCKED"].includes(cause.code)
    ) {
      setPreview(null);
      onBusy(false);
    }
  }
  async function apply() {
    if (!preview || busy) return;
    setError(null);
    setBusy(true);
    try {
      const next = await historyApi.apply(user, preview);
      onSaved(next, {
        formId: preview.target.formId,
        version: preview.target.version,
        name: preview.target.name,
        definition: preview.target.definition,
        fields: preview.target.fields,
      });
      onBusy(false);
    } catch (cause) {
      invalidate(cause);
    } finally {
      setBusy(false);
    }
  }
  return {
    latest,
    snapshots,
    loading,
    busy,
    error,
    preview,
    refresh,
    cancel,
    show,
    apply,
    validate,
  };
}
