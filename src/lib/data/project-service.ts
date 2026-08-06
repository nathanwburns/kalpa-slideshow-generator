import path from "path";
import fs from "fs/promises";
import { briefSchema, type AssetRecord, type BriefInput, type ProjectRecord, type SlideContent, type TemplateFamilyId } from "@/lib/schema";
import { createId, ensureProjectFilesDir, getProject, saveProject } from "@/lib/data/storage";
import { extractTextFromFile } from "@/lib/files/extract";
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

export async function saveOutline(projectId: string, outline: ProjectRecord["outline"]) {
  const project = await getProject(projectId);
  project.outline = outline;
  project.status = "outline";
  stampRevision(project, "Generated outline");
  return saveProject(project);
}

export async function saveSlides(projectId: string, slides: SlideContent[], label: string) {
  const project = await getProject(projectId);
  project.slides = slides;
  project.status = project.slides.length ? "generated" : project.status;
  stampRevision(project, label);
  return saveProject(project);
}
