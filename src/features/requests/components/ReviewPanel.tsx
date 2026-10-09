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

export function ReviewPanel({
  user,
  record,
  locale,
  onSaved,
  onBusy,
  onDirty,
  reload,
}: {
  user: User;
  record: RequestRecord;
  locale: Locale;
  onSaved: (record: RequestRecord) => void;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
  reload: () => void;
}) {
  const t = copy(locale);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);
  async function decide(decision: ReviewInput["decision"]) {
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
  }
  return (
    <section
      aria-labelledby="review-heading"
      className="tw:mt-6 tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-6"
    >
      <h2 id="review-heading" className="tw:mb-4 tw:text-base tw:font-semibold">
        {t.reviewTitle}
      </h2>
      {error && <ErrorNotice error={error} locale={locale} reload={reload} />}
      <label
        htmlFor="review-comment"
        className="tw:mb-2 tw:block tw:text-sm tw:font-medium"
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
        onChange={(e) => {
          setComment(e.target.value);
          onDirty(!!e.target.value);
        }}
        className="tw:w-full tw:rounded-lg tw:border tw:border-line tw:p-3 tw:text-sm"
      />
      <p id="review-help" className="tw:mt-2 tw:text-xs tw:text-muted">
        {t.reviewHelp}
      </p>
      <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-3">
        <span role="status" className="tw:mr-auto tw:text-xs tw:text-muted">
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
}
