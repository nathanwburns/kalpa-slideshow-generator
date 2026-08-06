"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectRecord, TemplateFamilyId } from "@/lib/schema";

const families: { id: TemplateFamilyId; label: string }[] = [
  { id: "human-centered-sales", label: "Human-Centered Sales" },
  { id: "blue-architectural", label: "Blue Architectural" },
  { id: "editorial-signal", label: "Editorial Signal" },
  { id: "strategic-frameworks", label: "Strategic Frameworks" }
];

export function DashboardClient({ projects }: { projects: ProjectRecord[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("Kalpa ERP strategy deck");
  const [description, setDescription] = useState("");
  const [templateFamily, setTemplateFamily] = useState<TemplateFamilyId>("human-centered-sales");
  const [creating, setCreating] = useState(false);

  async function createProject() {
    setCreating(true);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, templateFamily })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to create project");
      router.push(`/projects/${payload.data.id}`);
    } finally {
      setCreating(false);
    }
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
            <button className="rounded-2xl bg-kalpa-peach px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={creating || !title.trim()} onClick={createProject}>
              {creating ? "Creating…" : "Create project"}
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
