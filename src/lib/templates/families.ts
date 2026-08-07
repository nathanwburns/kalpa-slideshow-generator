import type { TemplateFamilyId } from "@/lib/schema";

export type FamilyTheme = {
  id: TemplateFamilyId;
  name: string;
  description: string;
  canvas: string;
  canvasSolid: string;
  panel: string;
  panelSolid: string;
  ink: string;
  muted: string;
  accent: string;
  signal: string;
  accentSoft: string;
  line: string;
  card: string;
  cardSolid: string;
  frame: string;
  edge: string;
  badgeBg: string;
  badgeInk: string;
  fontDisplay: string;
  fontBody: string;
};

export const familyThemes: Record<TemplateFamilyId, FamilyTheme> = {
  "blue-architectural": {
    id: "blue-architectural",
    name: "Executive Systems",
    description: "Structured, boardroom-oriented, and frame-led with deeper blues and measured contrast.",
    canvas: "linear-gradient(135deg, #081826 0%, #063D66 55%, #0D5E93 100%)",
    canvasSolid: "#081826",
    panel: "rgba(255,255,255,0.08)",
    panelSolid: "#0E2438",
    ink: "#FFFFFF",
    muted: "rgba(255,255,255,0.76)",
    accent: "#7FBCDE",
    signal: "#ED854D",
    accentSoft: "rgba(127,188,222,0.20)",
    line: "rgba(255,255,255,0.14)",
    card: "rgba(255,255,255,0.10)",
    cardSolid: "#15334A",
    frame: "rgba(255,255,255,0.22)",
    edge: "rgba(255,255,255,0.18)",
    badgeBg: "rgba(255,255,255,0.10)",
    badgeInk: "#FFFFFF",
    fontDisplay: "Sora",
    fontBody: "Inter"
  },
  "editorial-signal": {
    id: "editorial-signal",
    name: "Framed Advisory",
    description: "Paper-led, editorial, and highly legible with structured accents and concise hierarchy.",
    canvas: "linear-gradient(135deg, #F7F5F0 0%, #F3F0E8 58%, #ECE9E0 100%)",
    canvasSolid: "#F7F5F0",
    panel: "rgba(255,255,255,0.96)",
    panelSolid: "#FFFFFF",
    ink: "#102132",
    muted: "rgba(16,33,50,0.72)",
    accent: "#ED854D",
    signal: "#007ABE",
    accentSoft: "rgba(237,133,77,0.14)",
    line: "rgba(16,33,50,0.11)",
    card: "rgba(246,244,239,0.96)",
    cardSolid: "#F6F4EF",
    frame: "#C9D3DB",
    edge: "#DFE6EB",
    badgeBg: "#F4EEE7",
    badgeInk: "#102132",
    fontDisplay: "Sora",
    fontBody: "Inter"
  },
  "strategic-frameworks": {
    id: "strategic-frameworks",
    name: "Structural Proof",
    description: "Cleaner executive surfaces with sharper process logic, comparison framing, and proof modules.",
    canvas: "linear-gradient(135deg, #EEF3F7 0%, #E8EFF5 52%, #DFE9F0 100%)",
    canvasSolid: "#EEF3F7",
    panel: "rgba(255,255,255,0.97)",
    panelSolid: "#FFFFFF",
    ink: "#0F2235",
    muted: "rgba(15,34,53,0.72)",
    accent: "#007ABE",
    signal: "#ED854D",
    accentSoft: "rgba(0,122,190,0.12)",
    line: "rgba(15,34,53,0.10)",
    card: "rgba(255,255,255,0.94)",
    cardSolid: "#FFFFFF",
    frame: "#BFD0DC",
    edge: "#D8E3EA",
    badgeBg: "#EAF3FA",
    badgeInk: "#0F2235",
    fontDisplay: "Sora",
    fontBody: "Inter"
  },
  "human-centered-sales": {
    id: "human-centered-sales",
    name: "Warm Operational Clarity",
    description: "Warm Kalpa sales treatment balancing trust, proof, human reassurance, and structured framing.",
    canvas: "linear-gradient(135deg, #F7F5F0 0%, #F3F0E9 48%, #E8F0F5 100%)",
    canvasSolid: "#F7F5F0",
    panel: "rgba(255,255,255,0.94)",
    panelSolid: "#FFFFFF",
    ink: "#102132",
    muted: "rgba(16,33,50,0.72)",
    accent: "#FF8C00",
    signal: "#007ABE",
    accentSoft: "rgba(255,140,0,0.14)",
    line: "rgba(16,33,50,0.12)",
    card: "rgba(255,255,255,0.95)",
    cardSolid: "#FFFFFF",
    frame: "#C6D2DB",
    edge: "#DFE7ED",
    badgeBg: "#FDF1E8",
    badgeInk: "#102132",
    fontDisplay: "Sora",
    fontBody: "Inter"
  }
};
