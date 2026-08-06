import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import { adminSettingsSchema, type AdminSettings, projectSchema, type ProjectRecord } from "@/lib/schema";

const rootDir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
const projectsDir = path.join(rootDir, "projects");
const settingsPath = path.join(rootDir, "admin-settings.json");

const defaultSettings: AdminSettings = {
  systemPrompt:
    "You are Kalpa's senior presentation strategist. Build persuasive, executive-grade slides that stay within the chosen layout structure and never invent specific customer results unless they are provided in source material.",
  writingRules: [
    "Lead with business outcomes before features.",
    "Prefer short, confident headlines.",
    "Use plain language over consulting jargon.",
    "Keep bullets concrete and decision-oriented."
  ],
  bannedWords: ["revolutionary", "game-changing", "synergy"],
  imageGuidance:
    "Use realistic business and industrial imagery. Avoid cartoonish, surreal, or obviously synthetic visual descriptions.",
  salesDeckBias:
    "Optimize first for Kalpa sales decks and proposals in ERP, operations, finance, and implementation contexts.",
  preferredTemplateFamily: "human-centered-sales"
};

async function ensureDataDirs() {
  await fsp.mkdir(projectsDir, { recursive: true });
  try {
    await fsp.access(settingsPath);
  } catch {
    await fsp.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }
}

export async function getAdminSettings() {
  await ensureDataDirs();
  const raw = await fsp.readFile(settingsPath, "utf8");
  return adminSettingsSchema.parse(JSON.parse(raw));
}

export async function saveAdminSettings(input: AdminSettings) {
  await ensureDataDirs();
  const parsed = adminSettingsSchema.parse(input);
  await fsp.writeFile(settingsPath, JSON.stringify(parsed, null, 2));
  return parsed;
}

export async function listProjects() {
  await ensureDataDirs();
  const entries = await fsp.readdir(projectsDir);
  const records: ProjectRecord[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const raw = await fsp.readFile(path.join(projectsDir, entry), "utf8");
    records.push(projectSchema.parse(JSON.parse(raw)));
  }
  return records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getProject(projectId: string) {
  await ensureDataDirs();
  const raw = await fsp.readFile(path.join(projectsDir, `${projectId}.json`), "utf8");
  return projectSchema.parse(JSON.parse(raw));
}

export async function saveProject(project: ProjectRecord) {
  await ensureDataDirs();
  const parsed = projectSchema.parse(project);
  await fsp.writeFile(path.join(projectsDir, `${parsed.id}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function projectFilesDir(projectId: string) {
  return path.join(rootDir, "uploads", projectId);
}

export async function ensureProjectFilesDir(projectId: string) {
  const dir = projectFilesDir(projectId);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

export function absoluteDataPath(relativePath: string) {
  return path.join(rootDir, relativePath);
}

export function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}
