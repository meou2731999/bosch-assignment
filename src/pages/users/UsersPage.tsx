import { AdminLayout, type AdminPageProps } from "../../app/AdminLayout";
import { UsersPanel } from "../../features/admin/UsersPanel";

export const UsersPage = ({
  onSelfChanged,
  ...props
}: AdminPageProps & { onSelfChanged: () => Promise<void> }) => (
  <AdminLayout {...props} activeView="users">
    <UsersPanel
      locale={props.locale}
      userId={props.user.id}
      onSelfChanged={onSelfChanged}
    />
  </AdminLayout>
);
