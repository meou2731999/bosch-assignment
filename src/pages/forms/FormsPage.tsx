import { AdminLayout, type AdminPageProps } from "../../app/AdminLayout";
import { FormsPanel } from "../../features/admin/FormsPanel";

export const FormsPage = (props: AdminPageProps) => (
  <AdminLayout {...props} activeView="forms">
    <FormsPanel locale={props.locale} />
  </AdminLayout>
);
