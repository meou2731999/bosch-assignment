import { historyCopy } from "../history/copy";
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
  const h = historyCopy(locale);
  return (
    <section
      className="mt-8 [&_h2]:mb-4 [&_h2]:text-sm [&_h2]:font-semibold [&_ol]:m-0 [&_ol]:list-none [&_ol]:p-0 [&_li]:mb-5 [&_li]:flex [&_li]:flex-wrap [&_li]:items-baseline [&_li]:gap-3 [&_li]:text-xs [&_li>div]:flex [&_li>div]:min-w-0 [&_li>div]:flex-1 [&_li>div]:flex-col [&_li>div]:gap-1 [&_time]:text-xs [&_time]:text-muted"
      aria-label={t.history}
    >
      <h2>{t.history}</h2>
      <ol>
        {[...events].reverse().map((event, i) => (
          <li key={i}>
            <span
              className="size-1.5 shrink-0 rounded-full bg-green-700"
              aria-hidden="true"
            />
            <div>
              <strong>{t[event.action]}</strong>
              {event.fromVersion !== undefined && (
                <span>
                  {h.auditVersion}: {event.fromVersion} → {event.toVersion}
                </span>
              )}
              {event.snapshotRevision !== undefined && (
                <span>
                  {h.auditSnapshot}: {event.snapshotRevision}
                </span>
              )}
              {event.changes?.map((change) => (
                <span key={change.path}>
                  {change.path}: {h[change.kind]}
                </span>
              ))}
              {event.comment && (
                <p className="my-1 whitespace-pre-wrap break-words rounded-lg border border-line bg-white p-3 text-sm">
                  {event.comment}
                </p>
              )}
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
