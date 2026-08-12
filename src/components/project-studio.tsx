"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SlidePreview } from "@/components/slide-preview";
import { familyThemes } from "@/lib/templates/families";
import type { AdminSettings, OutlineItem, ProjectRecord, ThemeConcept } from "@/lib/schema";

const layoutOptions: OutlineItem["recommendedLayout"][] = [
  "hero",
  "challenge",
  "proof",
  "process",
  "industry-grid",
  "comparison",
  "quote",
  "cta"
];

type WorkspaceMode = "outline" | "deck";

export function ProjectStudio({ initialProject, settings }: { initialProject: ProjectRecord; settings: AdminSettings }) {
  const [project, setProject] = useState(initialProject);
  const [brief, setBrief] = useState(project.brief?.rawPrompt || "");
  const [audience, setAudience] = useState(project.brief?.audience || "");
  const [outcome, setOutcome] = useState(project.brief?.outcome || "");
  const [slideCount, setSlideCount] = useState(project.brief?.requestedSlideCount || 8);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [editInstruction, setEditInstruction] = useState("");
  const [outlineInstruction, setOutlineInstruction] = useState("");
  const [activeSlideId, setActiveSlideId] = useState(project.slides[0]?.id || "");
  const [activeOutlineId, setActiveOutlineId] = useState(project.outline[0]?.id || "");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(project.slides.length ? "deck" : "outline");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSlide = useMemo(
    () => project.slides.find((slide) => slide.id === activeSlideId) || project.slides[0] || null,
    [activeSlideId, project.slides]
  );
  const activeSlideIndex = activeSlide ? project.slides.findIndex((slide) => slide.id === activeSlide.id) : -1;

  const activeOutline = useMemo(
    () => project.outline.find((item) => item.id === activeOutlineId) || project.outline[0] || null,
    [activeOutlineId, project.outline]
  );
  const activeOutlineIndex = activeOutline ? project.outline.findIndex((item) => item.id === activeOutline.id) : -1;

  const selectedTheme = useMemo(
    () => project.themeConcepts.find((item) => item.id === project.selectedThemeConceptId) || project.themeConcepts[0] || null,
    [project.selectedThemeConceptId, project.themeConcepts]
  );

  useEffect(() => {
    if (!project.outline.length) {
      setWorkspaceMode(project.slides.length ? "deck" : "outline");
    }
  }, [project.outline.length, project.slides.length, workspaceMode]);

  async function reloadProject(projectId: string) {
    const response = await fetch(`/api/v1/projects/${projectId}`);
    const payload = await response.json();
    setProject(payload.data);
    setActiveSlideId((current) => current || payload.data.slides[0]?.id || "");
    setActiveOutlineId((current) => current || payload.data.outline[0]?.id || "");
  }

  async function saveBrief() {
    setBusy("brief");
    setError(null);
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save brief");
    } finally {
      setBusy(null);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      await fetch(`/api/v1/projects/${project.id}/assets`, { method: "POST", body: formData });
      await reloadProject(project.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to upload files");
    } finally {
      setBusy(null);
    }
  }

  async function generateQuestions() {
    setBusy("questions");
    setError(null);
    try {
      await fetch(`/api/v1/presentations/${project.id}/questions`, { method: "POST" });
      await reloadProject(project.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate questions");
    } finally {
      setBusy(null);
    }
  }

  async function generateOutline() {
    setBusy("outline");
    setError(null);
    try {
      await fetch(`/api/v1/presentations/${project.id}/outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: questionAnswers })
      });
      await reloadProject(project.id);
      setWorkspaceMode("outline");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate outline");
    } finally {
      setBusy(null);
    }
  }

  async function generateSlides() {
    setBusy("slides");
    setError(null);
    try {
      await fetch(`/api/v1/presentations/${project.id}/generate`, { method: "POST" });
      await reloadProject(project.id);
      setWorkspaceMode("deck");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate slides");
    } finally {
      setBusy(null);
    }
  }

  async function applyEdit(targetSlideId: string | null) {
    if (!editInstruction.trim()) return;
    setBusy("edit");
    setError(null);
    try {
      await fetch(`/api/v1/presentations/${project.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: editInstruction, targetSlideId })
      });
      await reloadProject(project.id);
      setEditInstruction("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to edit slides");
    } finally {
      setBusy(null);
    }
  }

  async function applyOutlineEdit(targetOutlineId: string | null) {
    if (!outlineInstruction.trim()) return;
    setBusy("outline-edit");
    setError(null);
    try {
      await fetch(`/api/v1/presentations/${project.id}/outline/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: outlineInstruction, targetOutlineId })
      });
      await reloadProject(project.id);
      setOutlineInstruction("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to edit outline");
    } finally {
      setBusy(null);
    }
  }

  function updateActiveOutlineField<K extends keyof OutlineItem>(field: K, value: OutlineItem[K]) {
    if (!activeOutline) return;
    setProject((current) => ({
      ...current,
      outline: current.outline.map((item) => (item.id === activeOutline.id ? { ...item, [field]: value } : item))
    }));
  }

  function normalizeOutline(outline: OutlineItem[]) {
    return outline.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
  }

  async function persistOutline(nextOutline: OutlineItem[], labelOnFailure: string) {
    setBusy("outline-save");
    setError(null);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outline: normalizeOutline(nextOutline) })
      });
      if (!response.ok) {
        throw new Error(labelOnFailure);
      }
      await reloadProject(project.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : labelOnFailure);
    } finally {
      setBusy(null);
    }
  }

  async function saveOutlineManually() {
    await persistOutline(project.outline, "Failed to save outline changes");
  }

  async function moveOutlineItem(direction: -1 | 1) {
    if (!activeOutline) return;
    const currentIndex = project.outline.findIndex((item) => item.id === activeOutline.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= project.outline.length) return;

    const nextOutline = [...project.outline];
    const [moved] = nextOutline.splice(currentIndex, 1);
    nextOutline.splice(targetIndex, 0, moved);
    const normalized = normalizeOutline(nextOutline);
    setProject((current) => ({ ...current, outline: normalized }));
    setActiveOutlineId(moved.id);
    await persistOutline(normalized, "Failed to reorder outline");
  }

  async function selectTheme(theme: ThemeConcept) {
    setBusy("theme");
    setError(null);
    try {
      await fetch(`/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedThemeConceptId: theme.id })
      });
      await reloadProject(project.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to select theme");
    } finally {
      setBusy(null);
    }
  }

  function goToSlide(offset: -1 | 1) {
    if (!project.slides.length) return;
    const nextIndex = activeSlideIndex < 0 ? 0 : (activeSlideIndex + offset + project.slides.length) % project.slides.length;
    setActiveSlideId(project.slides[nextIndex].id);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-panel">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-kalpa-frame bg-[linear-gradient(180deg,#ffffff,#f5f6f7)] shadow-frame">
            <Image src="/kalpa-logo.png" alt="Kalpa logo" width={44} height={44} priority />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{project.status}</div>
            <h1 className="text-3xl font-extrabold text-slate-950">{project.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{project.description || "Real AI workflow for this project."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Kalpa brand book loaded", "Theme-directed generation", "Editable PPTX export"].map((label) => (
                <div key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {label}
                </div>
              ))}
            </div>
          </div>
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

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="grid gap-6">
          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Brief</div>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Include the presentation goal, what the audience should understand or do after the deck, important context or constraints,
              proof points or source material to lean on, preferred tone, and how long the deck should be.
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-900">Deck brief</span>
                <textarea
                  className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  placeholder="Example: Create a 10-slide Kalpa Europe strategy deck for leadership review. Explain the market opportunity, the operating model shift, the critical risks, and the recommended next steps. Use uploaded material as the source of truth and keep the tone concise, strategic, and decision-oriented."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-900">Audience or audience website</span>
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="COO at a European distribution group, or https://targetcompany.com"
                  />
                  <span className="text-xs text-slate-500">You can paste a URL here, but the app still treats it as text context rather than crawling the site.</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-900">Desired outcome</span>
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    value={outcome}
                    onChange={(event) => setOutcome(event.target.value)}
                    placeholder="Win approval, align the team, or secure the next meeting"
                  />
                  <span className="text-xs text-slate-500">This tells the AI what the deck should persuade the audience to do.</span>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-900">Requested slide count</span>
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  type="number"
                  min={4}
                  max={14}
                  value={slideCount}
                  onChange={(event) => setSlideCount(Number(event.target.value || 8))}
                />
                <span className="text-xs text-slate-500">This is the target number of slides for the outline and generated deck.</span>
              </label>

              <button className="rounded-2xl bg-kalpa-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={saveBrief} disabled={busy !== null}>
                {busy === "brief" ? "Saving…" : "Save brief"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source files</div>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Upload a current proposal, ERP documentation, website copy, screenshots, or an existing PowerPoint you want remade in a new Kalpa style.
            </div>
            <input
              className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm"
              type="file"
              multiple
              accept=".txt,.md,.csv,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv,image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => uploadFiles(event.target.files)}
            />
            <div className="mt-4 grid max-h-56 gap-2 overflow-auto pr-1 text-sm text-slate-600">
              {project.assets.length ? (
                project.assets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="font-medium text-slate-900">{asset.name}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{asset.mimeType}</div>
                    {asset.extractedText ? <p className="mt-2 text-xs text-slate-600">{asset.extractedText.slice(0, 200)}…</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Upload briefs, PDFs, DOCX files, screenshots, or reference decks to ground the AI.
                </div>
              )}
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
                {busy === "slides" ? "Generating slides…" : "Generate slides"}
              </button>
            </div>

            {project.questions.length ? (
              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clarifying questions</div>
                <div className="grid max-h-80 gap-3 overflow-auto pr-1">
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
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Generate questions to refine the source of truth before building the outline.
              </div>
            )}
          </div>

          <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Theme directions</div>
                <h2 className="text-xl font-bold text-slate-950">Pick the feel before slide generation</h2>
              </div>
              {selectedTheme ? <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selectedTheme.name}</div> : null}
            </div>

            {project.themeConcepts.length ? (
              <div className="grid gap-3">
                {project.themeConcepts.map((theme) => {
                  const baseTheme = familyThemes[theme.templateFamily];
                  const selected = theme.id === project.selectedThemeConceptId;
                  return (
                    <button
                      key={theme.id}
                      className={`grid items-center gap-4 rounded-[24px] border p-4 text-left transition ${selected ? "border-kalpa-blue bg-[linear-gradient(180deg,#eff8ff,#f8fbff)] shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      onClick={() => selectTheme(theme)}
                      type="button"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="h-16 w-16 shrink-0 rounded-full border border-white/60 shadow-inner"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, ${theme.swatches[0] || baseTheme.accent} 0%, ${theme.swatches[1] || baseTheme.accentSoft} 45%, ${theme.swatches[2] || baseTheme.canvas} 100%)`
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-slate-950">{theme.name}</div>
                            <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{baseTheme.name}</div>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{theme.summary}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {theme.keywords.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                Theme directions will appear automatically after the outline is generated.
              </div>
            )}
          </div>
        </section>

        <section className="xl:sticky xl:top-6 xl:self-start">
          <div className="grid gap-6 rounded-[30px] bg-white/88 p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {workspaceMode === "deck" && project.slides.length ? "Deck editor" : project.outline.length ? "Outline editor" : "Build the outline first"}
                </h2>
              </div>
              <div className="flex rounded-full bg-slate-100 p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${workspaceMode === "outline" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
                  onClick={() => setWorkspaceMode("outline")}
                  type="button"
                  disabled={!project.outline.length}
                >
                  Outline
                </button>
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium ${workspaceMode === "deck" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
                  onClick={() => setWorkspaceMode("deck")}
                  type="button"
                  disabled={!project.slides.length}
                >
                  Deck
                </button>
              </div>
            </div>

            {workspaceMode === "outline" && project.outline.length ? (
              <div className="grid gap-5 lg:grid-cols-[0.48fr_0.52fr]">
                <div className="grid gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Outline flow</div>
                  <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
                    {project.outline.map((item) => (
                      <button
                        key={item.id}
                        className={`rounded-[22px] border p-4 text-left transition ${item.id === activeOutline?.id ? "border-kalpa-blue bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                        onClick={() => setActiveOutlineId(item.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Slide {item.sequence}</div>
                          <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{item.recommendedLayout}</div>
                        </div>
                        <div className="mt-2 font-semibold text-slate-950">{item.headline}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.keyMessage}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  {activeOutline ? (
                    <>
                      <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Outline slide {activeOutline.sequence}</div>
                            <div className="text-lg font-bold text-slate-950">Manual edits</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50" onClick={() => moveOutlineItem(-1)} disabled={busy !== null || activeOutlineIndex <= 0} type="button">
                              Move up
                            </button>
                            <button className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50" onClick={() => moveOutlineItem(1)} disabled={busy !== null || activeOutlineIndex === project.outline.length - 1} type="button">
                              Move down
                            </button>
                          </div>
                        </div>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-900">Headline</span>
                          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={activeOutline.headline} onChange={(event) => updateActiveOutlineField("headline", event.target.value)} />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-900">Purpose</span>
                          <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={activeOutline.purpose} onChange={(event) => updateActiveOutlineField("purpose", event.target.value)} />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-900">Key message</span>
                          <textarea className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={activeOutline.keyMessage} onChange={(event) => updateActiveOutlineField("keyMessage", event.target.value)} />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-900">Layout</span>
                          <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={activeOutline.recommendedLayout} onChange={(event) => updateActiveOutlineField("recommendedLayout", event.target.value as OutlineItem["recommendedLayout"])}>
                            {layoutOptions.map((layout) => (
                              <option key={layout} value={layout}>
                                {layout}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button className="rounded-2xl bg-kalpa-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={saveOutlineManually} disabled={busy !== null}>
                          {busy === "outline-save" ? "Saving outline…" : "Save outline changes"}
                        </button>
                      </div>

                      <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Natural-language outline editing</div>
                          <div className="mt-1 text-sm text-slate-600">Describe the change you want, then apply it to the selected outline slide or the full story arc.</div>
                        </div>
                        <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={outlineInstruction} onChange={(event) => setOutlineInstruction(event.target.value)} placeholder="Make this slide more executive. Combine slides 2 and 3. Change the intent from diagnosis to proposed solution. Replace the comparison slide with a phased roadmap." />
                        <div className="flex flex-wrap gap-3">
                          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => applyOutlineEdit(activeOutline.id)} disabled={busy !== null}>
                            {busy === "outline-edit" ? "Editing…" : "Edit active outline slide"}
                          </button>
                          <button className="rounded-full bg-kalpa-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => applyOutlineEdit(null)} disabled={busy !== null}>
                            Edit full outline
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {workspaceMode === "deck" && project.slides.length ? (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Deck preview</div>
                    <div className="text-lg font-bold text-slate-950">
                      Slide {activeSlideIndex + 1} of {project.slides.length}
                    </div>
                  </div>
                  {selectedTheme ? (
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {selectedTheme.name}
                    </div>
                  ) : null}
                </div>

                {activeSlide ? (
                  <>
                    <div className="relative rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f6f7f8,#eef2f5)] p-4">
                      <SlidePreview projectId={project.id} slide={activeSlide} assets={project.assets} templateFamily={project.templateFamily} />
                      <button
                        className="absolute left-7 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg ring-1 ring-slate-200"
                        onClick={() => goToSlide(-1)}
                        type="button"
                      >
                        ←
                      </button>
                      <button
                        className="absolute right-7 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg ring-1 ring-slate-200"
                        onClick={() => goToSlide(1)}
                        type="button"
                      >
                        →
                      </button>
                    </div>

                    <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{activeSlide.layoutKind}</div>
                      <div className="text-xl font-bold text-slate-950">{activeSlide.headline}</div>
                      <div className="text-sm text-slate-600">{activeSlide.subheadline || activeSlide.purpose}</div>
                      <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={editInstruction} onChange={(event) => setEditInstruction(event.target.value)} placeholder="Tighten this slide. Make the headline more strategic. Use less text. Shift the emphasis to implementation risk." />
                      <div className="flex flex-wrap gap-3">
                        <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => applyEdit(activeSlide.id)} disabled={busy !== null}>
                          {busy === "edit" ? "Editing…" : "Edit active slide"}
                        </button>
                        <button className="rounded-full bg-kalpa-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => applyEdit(null)} disabled={busy !== null}>
                          Edit full deck
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.slides.map((slide, index) => (
                        <button
                          key={slide.id}
                          className={`rounded-full px-3 py-2 text-sm font-medium ${slide.id === activeSlide.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                          onClick={() => setActiveSlideId(slide.id)}
                          type="button"
                        >
                          {index + 1}. {slide.headline.slice(0, 32)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {!project.outline.length ? (
              <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Generate the outline first. The right side becomes the main workspace once the deck structure exists.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
