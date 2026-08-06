"use client";

import { useMemo, useState } from "react";
import type { AdminSettings, ProjectRecord } from "@/lib/schema";
import { SlidePreview } from "@/components/slide-preview";

export function ProjectStudio({ initialProject, settings }: { initialProject: ProjectRecord; settings: AdminSettings }) {
  const [project, setProject] = useState(initialProject);
  const [brief, setBrief] = useState(project.brief?.rawPrompt || "");
  const [audience, setAudience] = useState(project.brief?.audience || "");
  const [outcome, setOutcome] = useState(project.brief?.outcome || "");
  const [slideCount, setSlideCount] = useState(project.brief?.requestedSlideCount || 8);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [editInstruction, setEditInstruction] = useState("");
  const [activeSlideId, setActiveSlideId] = useState(project.slides[0]?.id || "");
  const [busy, setBusy] = useState<string | null>(null);

  const activeSlide = useMemo(
    () => project.slides.find((slide) => slide.id === activeSlideId) || project.slides[0] || null,
    [activeSlideId, project.slides]
  );

  async function reloadProject(projectId: string) {
    const response = await fetch(`/api/v1/projects/${projectId}`);
    const payload = await response.json();
    setProject(payload.data);
    setActiveSlideId((current) => current || payload.data.slides[0]?.id || "");
  }

  async function saveBrief() {
    setBusy("brief");
    try {
      await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: {
            rawPrompt: brief,
            type: "sales",
            audience,
            outcome,
            context: "",
            requestedSlideCount: slideCount
          }
        })
      });
      await reloadProject(project.id);
    } finally {
      setBusy(null);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      await fetch(`/api/v1/projects/${project.id}/assets`, { method: "POST", body: formData });
      await reloadProject(project.id);
    } finally {
      setBusy(null);
    }
  }

  async function generateQuestions() {
    setBusy("questions");
    try {
      await fetch(`/api/v1/presentations/${project.id}/questions`, { method: "POST" });
      await reloadProject(project.id);
    } finally {
      setBusy(null);
    }
  }

  async function generateOutline() {
    setBusy("outline");
    try {
      await fetch(`/api/v1/presentations/${project.id}/outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: questionAnswers })
      });
      await reloadProject(project.id);
    } finally {
      setBusy(null);
    }
  }

  async function generateSlides() {
    setBusy("slides");
    try {
      await fetch(`/api/v1/presentations/${project.id}/generate`, { method: "POST" });
      await reloadProject(project.id);
    } finally {
      setBusy(null);
    }
  }

  async function applyEdit(targetSlideId: string | null) {
    if (!editInstruction.trim()) return;
    setBusy("edit");
    try {
      await fetch(`/api/v1/presentations/${project.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: editInstruction, targetSlideId })
      });
      await reloadProject(project.id);
      setEditInstruction("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[28px] bg-white/85 p-6 shadow-panel">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{project.status}</div>
          <h1 className="text-3xl font-extrabold text-slate-950">{project.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{project.description || "Real AI workflow for this project."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" href={`/api/v1/presentations/${project.id}/export/pptx`}>
            Export PPTX
          </a>
          <a className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" href="/admin">
            Admin
          </a>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <section className="grid gap-6">
          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Brief</div>
            <div className="grid gap-3">
              <textarea className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="What deck are you trying to create, for whom, and what should they believe or do after seeing it?" />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Audience" />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Desired outcome" />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" type="number" min={4} max={14} value={slideCount} onChange={(event) => setSlideCount(Number(event.target.value || 8))} />
              <button className="rounded-2xl bg-kalpa-blue px-4 py-3 text-sm font-semibold text-white" onClick={saveBrief} disabled={busy !== null}>
                {busy === "brief" ? "Saving…" : "Save brief"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source files</div>
            <input className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm" type="file" multiple onChange={(event) => uploadFiles(event.target.files)} />
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              {project.assets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="font-medium text-slate-900">{asset.name}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{asset.mimeType}</div>
                  {asset.extractedText ? <p className="mt-2 text-xs text-slate-600">{asset.extractedText.slice(0, 180)}…</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 flex flex-wrap gap-3">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={generateQuestions} disabled={busy !== null || !project.brief}>
                {busy === "questions" ? "Generating questions…" : "Generate questions"}
              </button>
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={generateOutline} disabled={busy !== null || !project.questions.length}>
                {busy === "outline" ? "Generating outline…" : "Generate outline"}
              </button>
              <button className="rounded-full bg-kalpa-peach px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={generateSlides} disabled={busy !== null || !project.outline.length}>
                {busy === "slides" ? "Generating deck…" : "Generate slides"}
              </button>
            </div>

            {project.questions.length ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clarifying questions</div>
                {project.questions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-medium text-slate-900">{question.question}</div>
                    <div className="mt-1 text-xs text-slate-500">{question.reason}</div>
                    <textarea
                      className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder={question.assumption ? `If skipped: ${question.assumption}` : "Answer"}
                      value={questionAnswers[question.id] || ""}
                      onChange={(event) => setQuestionAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {project.outline.length ? (
              <div className="mt-6 grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outline</div>
                {project.outline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-kalpa-blue">{item.recommendedLayout}</div>
                    <div className="mt-1 font-semibold text-slate-900">{item.headline}</div>
                    <div className="mt-1 text-sm text-slate-600">{item.keyMessage}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deck editor</div>
                <h2 className="text-2xl font-bold text-slate-950">{project.slides.length ? `${project.slides.length} slides` : "No slides yet"}</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{settings.preferredTemplateFamily}</div>
            </div>

            {activeSlide ? (
              <div className="grid gap-4">
                <SlidePreview projectId={project.id} slide={activeSlide} assets={project.assets} templateFamily={project.templateFamily} />
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{activeSlide.layoutKind}</div>
                  <div className="mt-1 text-xl font-bold text-slate-950">{activeSlide.headline}</div>
                  <div className="mt-1 text-sm text-slate-600">{activeSlide.subheadline}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Generate slides to start reviewing the deck.</div>
            )}
          </div>

          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Natural-language editing</div>
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={editInstruction} onChange={(event) => setEditInstruction(event.target.value)} placeholder="Make the headline sharper. Reduce text across the deck. Make slide 3 more visual. Tighten the CTA." />
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => applyEdit(activeSlide?.id || null)} disabled={busy !== null || !activeSlide}>
                Edit active slide
              </button>
              <button className="rounded-full bg-kalpa-blue px-4 py-2 text-sm font-semibold text-white" onClick={() => applyEdit(null)} disabled={busy !== null || !project.slides.length}>
                Edit full deck
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {project.slides.map((slide) => (
              <button
                key={slide.id}
                className={`rounded-[22px] border p-3 text-left ${slide.id === activeSlide?.id ? "border-kalpa-blue bg-blue-50" : "border-slate-200 bg-white"}`}
                onClick={() => setActiveSlideId(slide.id)}
              >
                <SlidePreview projectId={project.id} slide={slide} assets={project.assets} templateFamily={project.templateFamily} className="mb-3" />
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{slide.layoutKind}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{slide.headline}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
