import { useEffect, useState } from "react";
import { USERS, type Locale } from "../../shared/model";
import { Workspace } from "./Workspace";

export function App() {
  const [user, setUser] = useState(USERS[0]);
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <Workspace
      key={user.id}
      user={user}
      locale={locale}
      setLocale={setLocale}
      setUser={setUser}
    />
  );
}
