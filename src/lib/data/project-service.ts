import path from "path";
import fs from "fs/promises";
import {
  briefSchema,
  type AssetRecord,
  type BriefInput,
  type OutlineItem,
  type ProjectRecord,
  type SlideContent,
  type TemplateFamilyId,
  type ThemeConcept
} from "@/lib/schema";
import { createId, ensureProjectFilesDir, getProject, saveProject } from "@/lib/data/storage";
import { extractTextFromFile } from "@/lib/files/extract";
import { withKalpaBookends } from "@/lib/slides/bookends";
import { slugify } from "@/lib/utils";

export function createProjectRecord(input: {
  title: string;
  description?: string;
  templateFamily: TemplateFamilyId;
  brief?: BriefInput | null;
}): ProjectRecord {
  const now = new Date().toISOString();
  return {
    id: createId("proj"),
    title: input.title,
    description: input.description || "",
    createdAt: now,
    updatedAt: now,
    status: input.brief ? "questions" : "draft",
    brief: input.brief ? briefSchema.parse(input.brief) : null,
    templateFamily: input.templateFamily,
    questions: [],
    outline: [],
    slides: [],
    assets: [],
    themeConcepts: [],
    selectedThemeConceptId: null,
    revisions: []
  };
}

export function stampRevision(project: ProjectRecord, label: string) {
  project.revisions.unshift({
    id: createId("rev"),
    label,
    createdAt: new Date().toISOString()
  });
  project.updatedAt = new Date().toISOString();
}

export async function addUploadedFiles(projectId: string, files: File[]) {
  const project = await getProject(projectId);
  const dir = await ensureProjectFilesDir(projectId);
  const created: AssetRecord[] = [];

  for (const file of files) {
    const ext = path.extname(file.name);
    const storedName = `${Date.now()}-${slugify(path.basename(file.name, ext))}${ext}`;
    const relativePath = path.join("uploads", projectId, storedName);
    const absolutePath = path.join(dir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    const asset: AssetRecord = {
      id: createId("asset"),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      path: relativePath,
      extractedText: await extractTextFromFile(absolutePath, file.type || ""),
      createdAt: new Date().toISOString()
    };
    project.assets.push(asset);
    created.push(asset);
  }

  stampRevision(project, `Uploaded ${created.length} file${created.length === 1 ? "" : "s"}`);
  await saveProject(project);
  return { project, assets: created };
}

export async function updateProjectBrief(projectId: string, brief: BriefInput) {
  const project = await getProject(projectId);
  project.brief = briefSchema.parse(brief);
  project.status = "questions";
  stampRevision(project, "Updated brief");
  return saveProject(project);
}

export async function saveQuestions(projectId: string, questions: ProjectRecord["questions"]) {
  const project = await getProject(projectId);
  project.questions = questions;
  project.status = "questions";
  stampRevision(project, "Generated clarifying questions");
  return saveProject(project);
}

export async function saveOutline(
  projectId: string,
  outline: OutlineItem[],
  options?: {
    label?: string;
    themeConcepts?: ThemeConcept[];
    selectedThemeConceptId?: string | null;
    templateFamily?: TemplateFamilyId;
  }
) {
  const project = await getProject(projectId);
  project.outline = outline;
  project.status = "outline";
  if (options?.themeConcepts) {
    project.themeConcepts = options.themeConcepts;
  }
  if (options?.selectedThemeConceptId !== undefined) {
    project.selectedThemeConceptId = options.selectedThemeConceptId;
  }
  if (options?.templateFamily) {
    project.templateFamily = options.templateFamily;
  }
  stampRevision(project, options?.label || "Generated outline");
  return saveProject(project);
}

export async function saveSlides(projectId: string, slides: SlideContent[], label: string, generatedAssets: AssetRecord[] = []) {
  const project = await getProject(projectId);
  project.assets.push(...generatedAssets);
  // These bookends are application-owned so AI edits cannot remove the Kalpa welcome or contact slide.
  project.slides = withKalpaBookends(slides, project.title, project.brief);
  project.status = project.slides.length ? "generated" : project.status;
  stampRevision(project, label);
  return saveProject(project);
}
