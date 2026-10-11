import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { authCopy } from "../auth/copy";
import { formCopy } from "../forms/copy";
import { adminApi } from "../auth/api";
export function UsersTable({
  users,
  locale,
  busy,
  onSelect,
  act,
}: {
  users: AccountUser[];
  locale: Locale;
  busy: boolean;
  onSelect: (mode: "edit" | "reset" | "permissions", user: AccountUser) => void;
  act: (
    operation: () => Promise<AccountUser>,
    message: string,
  ) => Promise<void>;
}) {
  const t = authCopy(locale);
  const f = formCopy(locale);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:p-4 [&_th]:p-4">
        <caption className="sr-only">{t.users}</caption>
        <thead>
          <tr>
            <th>{t.name}</th>
            <th>{t.email}</th>
            <th>{t.role}</th>
            <th>{t.status}</th>
            <th>{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                {user.name}
                <small className="block text-muted">{user.department}</small>
              </td>
              <td>{user.email}</td>
              <td>
                {t[user.role]}
                {user.isAdmin && ` · ${t.admin}`}
              </td>
              <td>{user.active ? t.active : t.disabled}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onSelect("edit", user)}
                  >
                    {t.edit}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onSelect("reset", user)}
                  >
                    {t.reset}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onSelect("permissions", user)}
                  >
                    {f.permissions}
                  </Button>
                  <Button
                    variant={user.active ? "danger" : "secondary"}
                    disabled={busy}
                    onClick={() => {
                      if (!user.active || window.confirm(t.confirmDisable))
                        void act(
                          () =>
                            adminApi.edit(user.id, {
                              active: !user.active,
                            }),
                          t.saved,
                        );
                    }}
                  >
                    {user.active ? t.disable : t.enable}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
