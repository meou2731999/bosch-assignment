import { USERS, type AuditEvent, type Locale } from "../../../../shared/model";
import { copy } from "../../../i18n";
export function ActivityTimeline({
  events,
  locale,
}: {
  events: AuditEvent[];
  locale: Locale;
}) {
  const t = copy(locale);
  return (
    <section
      className="tw:mt-8 tw:[&_h2]:mb-4 tw:[&_h2]:text-sm tw:[&_h2]:font-semibold tw:[&_ol]:m-0 tw:[&_ol]:list-none tw:[&_ol]:p-0 tw:[&_li]:mb-5 tw:[&_li]:flex tw:[&_li]:flex-wrap tw:[&_li]:items-baseline tw:[&_li]:gap-3 tw:[&_li]:text-xs tw:[&_li>div]:flex tw:[&_li>div]:min-w-0 tw:[&_li>div]:flex-1 tw:[&_li>div]:flex-col tw:[&_li>div]:gap-1 tw:[&_time]:text-xs tw:[&_time]:text-muted"
      aria-label={t.history}
    >
      <h2>{t.history}</h2>
      <ol>
        {[...events].reverse().map((event, i) => (
          <li key={i}>
            <span
              className="tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-green-700"
              aria-hidden="true"
            />
            <div>
              <strong>{t[event.action]}</strong>
              <span>
                {USERS.find((u) => u.id === event.actorId)?.name ??
                  event.actorId}
              </span>
            </div>
            <time dateTime={event.at}>
              {new Date(event.at).toLocaleString(
                locale === "vi" ? "vi-VN" : "en-GB",
              )}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
