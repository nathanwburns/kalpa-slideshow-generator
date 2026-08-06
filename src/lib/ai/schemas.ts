export const questionsJsonSchema = {
  name: "clarifying_questions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            reason: { type: "string" },
            assumption: { type: "string" }
          },
          required: ["id", "question", "reason", "assumption"]
        }
      }
    },
    required: ["questions"]
  }
} as const;

export const outlineJsonSchema = {
  name: "presentation_outline",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      outline: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            sequence: { type: "integer" },
            purpose: { type: "string" },
            headline: { type: "string" },
            keyMessage: { type: "string" },
            recommendedLayout: {
              type: "string",
              enum: ["hero", "challenge", "proof", "process", "industry-grid", "comparison", "quote", "cta"]
            }
          },
          required: ["id", "sequence", "purpose", "headline", "keyMessage", "recommendedLayout"]
        }
      }
    },
    required: ["outline"]
  }
} as const;

export const themeConceptsJsonSchema = {
  name: "theme_concepts",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      themeConcepts: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            summary: { type: "string" },
            rationale: { type: "string" },
            keywords: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4
            },
            swatches: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4
            },
            templateFamily: {
              type: "string",
              enum: [
                "blue-architectural",
                "editorial-signal",
                "strategic-frameworks",
                "human-centered-sales"
              ]
            }
          },
          required: ["id", "name", "summary", "rationale", "keywords", "swatches", "templateFamily"]
        }
      }
    },
    required: ["themeConcepts"]
  }
} as const;

export const slidesJsonSchema = {
  name: "presentation_slides",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      slides: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            sequence: { type: "integer" },
            purpose: { type: "string" },
            layoutKind: {
              type: "string",
              enum: ["hero", "challenge", "proof", "process", "industry-grid", "comparison", "quote", "cta"]
            },
            eyebrow: { type: "string" },
            headline: { type: "string" },
            subheadline: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            stats: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  value: { type: "string" }
                },
                required: ["label", "value"]
              }
            },
            steps: { type: "array", items: { type: "string" } },
            leftColumnTitle: { type: "string" },
            leftColumnPoints: { type: "array", items: { type: "string" } },
            rightColumnTitle: { type: "string" },
            rightColumnPoints: { type: "array", items: { type: "string" } },
            quote: { type: "string" },
            quoteAttribution: { type: "string" },
            ctaText: { type: "string" },
            ctaSubtext: { type: "string" },
            contactLine: { type: "string" },
            imageAssetIds: { type: "array", items: { type: "string" } },
            notes: { type: "string" }
          },
          required: [
            "id",
            "sequence",
            "purpose",
            "layoutKind",
            "eyebrow",
            "headline",
            "subheadline",
            "bullets",
            "stats",
            "steps",
            "leftColumnTitle",
            "leftColumnPoints",
            "rightColumnTitle",
            "rightColumnPoints",
            "quote",
            "quoteAttribution",
            "ctaText",
            "ctaSubtext",
            "contactLine",
            "imageAssetIds",
            "notes"
          ]
        }
      }
    },
    required: ["slides"]
  }
} as const;
