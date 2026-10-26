import { useRef, useState } from "react";
import type {
  Locale,
  RequestRecord,
  ReviewInput,
  User,
} from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Button } from "../../../components/ui/Button";
import { ErrorNotice } from "../../../components/ui/ErrorNotice";
import { api } from "../api";

export const ReviewPanel = ({
  user,
  record,
  locale,
  onSaved,
  onBusy,
  onDirty,
  reload,
}: Readonly<{
  user: User;
  record: RequestRecord;
  locale: Locale;
  onSaved: (record: RequestRecord) => void;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
  reload: () => void;
}>) => {
  const t = copy(locale);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);
  const decide = async (decision: ReviewInput["decision"]) => {
    if (inFlight.current) return;
    if (decision === "reject" && !comment.trim()) {
      setError(new Error(t.rejectReason));
      return;
    }
    if (comment.trim().length > 2000) {
      setError(new Error(t.commentLimit));
      return;
    }
    inFlight.current = true;
    setSaving(true);
    onBusy(true);
    setError(null);
    try {
      onSaved(
        await api.review(user, record.id, {
          revision: record.revision,
          decision,
          comment,
        }),
      );
    } catch (e) {
      setError(e as Error);
    } finally {
      inFlight.current = false;
      setSaving(false);
      onBusy(false);
    }
  };
  const changeComment = (value: string) => {
    setComment(value);
    onDirty(Boolean(value));
  };
  return (
    <section
      aria-labelledby="review-heading"
      className="mt-6 rounded-xl border border-line bg-white p-6"
    >
      <h2 id="review-heading" className="mb-4 text-base font-semibold">
        {t.reviewTitle}
      </h2>
      {error && <ErrorNotice error={error} locale={locale} reload={reload} />}
      <label
        htmlFor="review-comment"
        className="mb-2 block text-sm font-medium"
      >
        {t.reviewComment}
      </label>
      <textarea
        id="review-comment"
        rows={3}
        maxLength={2000}
        value={comment}
        disabled={saving}
        aria-describedby="review-help"
        onChange={(event) => changeComment(event.target.value)}
        className="w-full rounded-lg border border-line p-3 text-sm"
      />
      <p id="review-help" className="mt-2 text-xs text-muted">
        {t.reviewHelp}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <span role="status" className="mr-auto text-xs text-muted">
          {saving ? t.reviewing : ""}
        </span>
        <Button
          variant="danger"
          disabled={saving}
          onClick={() => void decide("reject")}
        >
          {t.reject}
        </Button>
        <Button disabled={saving} onClick={() => void decide("approve")}>
          {t.approve}
        </Button>
      </div>
    </section>
  );
};
