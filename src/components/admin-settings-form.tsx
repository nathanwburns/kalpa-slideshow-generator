"use client";

import { useState } from "react";
import type { AdminSettings } from "@/lib/schema";

export function AdminSettingsForm({ initialSettings }: { initialSettings: AdminSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="rounded-[28px] bg-white/85 p-6 shadow-panel">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Generation rules</h1>
        <p className="mt-2 text-sm text-slate-600">These settings are live. New outline and slide generation calls read from this rule set immediately.</p>
      </div>

      <div className="grid gap-6 rounded-[28px] bg-white/85 p-6 shadow-panel">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">System prompt</span>
          <textarea className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={settings.systemPrompt} onChange={(event) => setSettings({ ...settings, systemPrompt: event.target.value })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Writing rules</span>
          <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={settings.writingRules.join("\n")} onChange={(event) => setSettings({ ...settings, writingRules: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Banned words</span>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={settings.bannedWords.join(", ")} onChange={(event) => setSettings({ ...settings, bannedWords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Image guidance</span>
          <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={settings.imageGuidance} onChange={(event) => setSettings({ ...settings, imageGuidance: event.target.value })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Sales deck bias</span>
          <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={settings.salesDeckBias} onChange={(event) => setSettings({ ...settings, salesDeckBias: event.target.value })} />
        </label>
        <button className="w-fit rounded-full bg-kalpa-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save rules"}
        </button>
      </div>
    </div>
  );
}
