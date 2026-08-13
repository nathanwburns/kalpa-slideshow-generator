"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import type { ProjectRecord } from "@/lib/schema";

export function DashboardClient({ projects }: { projects: ProjectRecord[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("Kalpa ERP strategy deck");
  const [description, setDescription] = useState("");
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
        body: JSON.stringify({ title, description })
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
      <header className="relative grid gap-4 overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#041420_0%,#0a3558_54%,#0c69a3_100%)] p-8 text-white shadow-panel md:grid-cols-[1.15fr_0.85fr]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,188,222,0.24),transparent_26%),radial-gradient(circle_at_82%_14%,rgba(237,133,77,0.18),transparent_18%)]" />
        <div className="pointer-events-none absolute right-10 top-8 hidden h-24 w-24 rounded-[28px] border border-white/12 bg-white/6 xl:block" />
        <div className="pointer-events-none absolute bottom-10 right-20 hidden h-28 w-28 rotate-45 rounded-[24px] border border-white/12 bg-white/6 xl:block" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/14 bg-white/10 shadow-frame backdrop-blur-sm">
              <Image src="/kalpa-logo.png" alt="Kalpa logo" width={46} height={46} priority />
            </div>
            <div>
              <div className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
                Kalpa Slideshow Generator Tool
              </div>
              <div className="mt-2 text-sm font-medium text-white/72">Right-fit ERP storytelling, rendered as editable decks.</div>
            </div>
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight">
            Build real Kalpa decks with live AI generation and editable Google Slides export.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/78">
            This build is optimized first for Kalpa sales and proposal workflows: brief, context uploads, outline generation,
            deck composition, slide-level editing, and native Google Slides export.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Brand-book guided AI", "Reference deck restyling", "Framed Kalpa layouts"].map((label) => (
              <div key={label} className="rounded-full border border-white/18 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="relative rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">New project</div>
            <div className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
              Live AI
            </div>
          </div>
          <div className="grid gap-3">
            <input
              className="rounded-2xl border border-white/12 bg-white/92 px-4 py-3 text-sm text-slate-900"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <textarea
              className="min-h-24 rounded-2xl border border-white/12 bg-white/92 px-4 py-3 text-sm text-slate-900"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional internal note"
            />
            <div className="rounded-[24px] border border-dashed border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Reference files</div>
                  <div className="text-xs text-white/70">Upload source docs or reference visuals before creating the project. PDF, DOCX, TXT, CSV, MD, PPTX, PNG, JPG, WEBP, and GIF are supported.</div>
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
                  accept=".txt,.md,.csv,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv,image/png,image/jpeg,image/webp,image/gif"
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
                  Add a brief, a past proposal, a screenshot, or an existing PowerPoint you want the system to reinterpret into a new Kalpa frame system.
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
