import type { ComponentProps, ReactNode } from "react";
import { AppHeader } from "./AppHeader";

export type AdminPageProps = Omit<
  ComponentProps<typeof AppHeader>,
  "activeView" | "loading"
>;

export const AdminLayout = ({
  children,
  activeView,
  ...headerProps
}: AdminPageProps & {
  activeView: "users" | "forms";
  children: ReactNode;
}) => (
  <>
    <AppHeader {...headerProps} activeView={activeView} loading={false} />
    {children}
  </>
);
