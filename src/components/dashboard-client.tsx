"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import type { ProjectRecord, TemplateFamilyId } from "@/lib/schema";

const families: { id: TemplateFamilyId; label: string }[] = [
  { id: "human-centered-sales", label: "Human-Centered Sales" },
  { id: "blue-architectural", label: "Blue Architectural" },
  { id: "editorial-signal", label: "Editorial Signal" },
  { id: "strategic-frameworks", label: "Strategic Frameworks" }
];

export function DashboardClient({ projects }: { projects: ProjectRecord[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("Kalpa ERP strategy deck");
  const [description, setDescription] = useState("");
  const [templateFamily, setTemplateFamily] = useState<TemplateFamilyId>("human-centered-sales");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, templateFamily })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to create project");

      if (pendingFiles.length) {
        const formData = new FormData();
        pendingFiles.forEach((file) => formData.append("files", file));
        const uploadResponse = await fetch(`/api/v1/projects/${payload.data.id}/assets`, {
          method: "POST",
          body: formData
        });

        if (!uploadResponse.ok) {
          const uploadPayload = await uploadResponse.json().catch(() => null);
          throw new Error(uploadPayload?.error?.message || "Project created but files failed to upload");
        }
      }

      router.push(`/projects/${payload.data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;

    setPendingFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const additions = nextFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return [...current, ...additions];
    });

    event.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-8">
      <header className="grid gap-4 rounded-[28px] bg-[linear-gradient(135deg,#041420_0%,#0a3558_58%,#0c69a3_100%)] p-8 text-white shadow-panel md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            Kalpa Slideshow Generator
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight">
            Build real Kalpa decks with live AI generation and editable PowerPoint export.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/78">
            This build is optimized first for Kalpa sales and proposal workflows: brief, context uploads, outline generation,
            deck composition, slide-level editing, and PPTX export.
          </p>
        </div>
        <div className="rounded-[24px] bg-white/10 p-5">
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">New project</div>
          <div className="grid gap-3">
            <input className="rounded-2xl border border-white/12 bg-white/90 px-4 py-3 text-sm text-slate-900" value={title} onChange={(event) => setTitle(event.target.value)} />
            <textarea className="min-h-24 rounded-2xl border border-white/12 bg-white/90 px-4 py-3 text-sm text-slate-900" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional internal note" />
            <select className="rounded-2xl border border-white/12 bg-white/90 px-4 py-3 text-sm text-slate-900" value={templateFamily} onChange={(event) => setTemplateFamily(event.target.value as TemplateFamilyId)}>
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
            <div className="rounded-[22px] border border-dashed border-white/30 bg-white/8 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Reference files</div>
                  <div className="text-xs text-white/70">Upload source docs before creating the project. PDF, DOCX, TXT, CSV, MD, and PPTX are supported.</div>
                </div>
                <button
                  className="rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add files
                </button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv"
                  onChange={addFiles}
                />
              </div>

              {pendingFiles.length ? (
                <div className="mt-4 grid gap-2">
                  {pendingFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-900">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{file.name}</div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{file.type || "unknown"} • {Math.max(1, Math.round(file.size / 1024))} KB</div>
                      </div>
                      <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700" type="button" onClick={() => removePendingFile(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/12 bg-black/10 px-4 py-3 text-sm text-white/72">
                  Add a brief, a past proposal, or an existing PowerPoint you want the system to reinterpret in a new Kalpa layout.
                </div>
              )}
            </div>

            {error ? <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <button className="rounded-2xl bg-kalpa-peach px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={creating || !title.trim()} onClick={createProject}>
              {creating ? (pendingFiles.length ? "Creating and uploading…" : "Creating…") : pendingFiles.length ? `Create project with ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}` : "Create project"}
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 rounded-[28px] bg-white/80 p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Projects</div>
            <h2 className="text-2xl font-bold text-slate-900">Recent work</h2>
          </div>
          <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" href="/admin">
            Admin rules
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                <span>{project.status}</span>
                <span>{project.templateFamily}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{project.description || "No description yet."}</p>
              <div className="mt-4 text-xs text-slate-500">{project.slides.length} slides • {new Date(project.updatedAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
