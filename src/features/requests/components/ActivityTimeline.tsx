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
    <section className="activity" aria-label={t.history}>
      <h2>{t.history}</h2>
      <ol>
        {[...events].reverse().map((event, i) => (
          <li key={i}>
            <span className="activity-dot" aria-hidden="true" />
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
