import type { TemplateFamilyId } from "@/lib/schema";

export type FamilyTheme = {
  id: TemplateFamilyId;
  name: string;
  description: string;
  canvas: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  line: string;
  card: string;
  fontDisplay: string;
  fontBody: string;
};

export const familyThemes: Record<TemplateFamilyId, FamilyTheme> = {
  "blue-architectural": {
    id: "blue-architectural",
    name: "Blue Architectural",
    description: "Structured, calm, and system-minded with strong blue framing.",
    canvas: "linear-gradient(135deg, #02111B 0%, #07335A 56%, #0C5B8F 100%)",
    panel: "rgba(255,255,255,0.08)",
    ink: "#FFFFFF",
    muted: "rgba(255,255,255,0.76)",
    accent: "#7FBCDE",
    accentSoft: "rgba(127,188,222,0.20)",
    line: "rgba(255,255,255,0.14)",
    card: "rgba(255,255,255,0.10)",
    fontDisplay: "Inter",
    fontBody: "Inter"
  },
  "editorial-signal": {
    id: "editorial-signal",
    name: "Editorial Signal",
    description: "Sharper typography and stronger contrast for punchier statements.",
    canvas: "linear-gradient(135deg, #08121D 0%, #0E2438 44%, #173E62 100%)",
    panel: "rgba(255,255,255,0.94)",
    ink: "#102132",
    muted: "rgba(16,33,50,0.72)",
    accent: "#ED854D",
    accentSoft: "rgba(237,133,77,0.16)",
    line: "rgba(16,33,50,0.12)",
    card: "rgba(255,255,255,0.88)",
    fontDisplay: "Inter",
    fontBody: "Inter"
  },
  "strategic-frameworks": {
    id: "strategic-frameworks",
    name: "Strategic Frameworks",
    description: "Lighter executive surfaces with clearer diagram and process emphasis.",
    canvas: "linear-gradient(135deg, #F3F7FA 0%, #E8F0F7 56%, #DCEAF3 100%)",
    panel: "rgba(255,255,255,0.96)",
    ink: "#0F2235",
    muted: "rgba(15,34,53,0.72)",
    accent: "#007ABE",
    accentSoft: "rgba(0,122,190,0.12)",
    line: "rgba(15,34,53,0.10)",
    card: "rgba(255,255,255,0.92)",
    fontDisplay: "Inter",
    fontBody: "Inter"
  },
  "human-centered-sales": {
    id: "human-centered-sales",
    name: "Human-Centered Sales",
    description: "Warm Kalpa sales treatment balancing trust, proof, and human reassurance.",
    canvas: "linear-gradient(135deg, #03121D 0%, #08365C 55%, #0C6BA5 100%)",
    panel: "rgba(255,255,255,0.93)",
    ink: "#102132",
    muted: "rgba(16,33,50,0.72)",
    accent: "#FF8C00",
    accentSoft: "rgba(255,140,0,0.16)",
    line: "rgba(16,33,50,0.12)",
    card: "rgba(255,255,255,0.92)",
    fontDisplay: "Inter",
    fontBody: "Inter"
  }
};
