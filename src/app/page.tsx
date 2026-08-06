import { DashboardClient } from "@/components/dashboard-client";
import { listProjects } from "@/lib/data/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();
  return <DashboardClient projects={projects} />;
}
