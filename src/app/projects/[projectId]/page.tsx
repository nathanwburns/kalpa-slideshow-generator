import { notFound } from "next/navigation";
import { ProjectStudio } from "@/components/project-studio";
import { getAdminSettings, getProject } from "@/lib/data/storage";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const [project, settings] = await Promise.all([getProject(projectId), getAdminSettings()]);
    return <ProjectStudio initialProject={project} settings={settings} />;
  } catch {
    notFound();
  }
}
