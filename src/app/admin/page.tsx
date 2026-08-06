import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getAdminSettings } from "@/lib/data/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const settings = await getAdminSettings();
  return <AdminSettingsForm initialSettings={settings} />;
}
