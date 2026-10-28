import { useEffect, useState } from "react";
import type { AccountUser, Locale } from "../../shared/model";
import { authApi } from "../features/auth/api";
import { HttpError, setCsrfToken } from "../lib/http";

export type AppView = "requests" | "users" | "forms" | "password";

export const useAppSession = () => {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>("requests");
  const [notice, setNotice] = useState<"changed" | "expired" | "">("");
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    let live = true;
    authApi
      .session()
      .then((next) => {
        if (live) setUser(next);
      })
      .catch((error) => {
        if (
          live &&
          !(error instanceof HttpError && error.code === "UNAUTHENTICATED")
        )
          setError(error);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setView("requests");
      setNotice("expired");
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const logout = async () => {
    setBusy(true);
    setError(null);
    try {
      await authApi.logout();
      setUser(null);
      setView("requests");
      setNotice("");
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  };
  const changed = () => {
    setCsrfToken("");
    setUser(null);
    setView("requests");
    setNotice("changed");
  };
  const login = (next: AccountUser) => {
    setUser(next);
    setError(null);
    setNotice("");
    setView(next.isAdmin ? "users" : "requests");
  };
  const refreshUser = async () => {
    setUser(await authApi.session());
  };
  return {
    user,
    locale,
    setLocale,
    loading,
    view,
    setView,
    notice,
    error,
    busy,
    logout,
    changed,
    login,
    refreshUser,
  };
};
