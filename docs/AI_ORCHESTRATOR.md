# AI Orchestrator

## Purpose
The AI Orchestrator coordinates the staged generation pipeline that turns user input and source material into validated presentation revisions. It manages context assembly, model routing, job execution, retries, approvals, caching, persistence, cost tracking, and quality gates.

It must not contain presentation design logic, rendering logic, or database access details directly. Instead, it coordinates versioned generation stages and application services through explicit interfaces.

## Core responsibilities
- accept generation and revision requests;
- resolve project, presentation, and revision context;
- authorize access before loading sensitive data;
- assemble the minimum required context for each stage;
- execute stages in the correct order;
- parallelize safe independent work;
- validate structured outputs;
- retry recoverable failures;
- pause for user or administrator approval;
- persist immutable stage results and presentation revisions;
- emit usage, audit, and telemetry records;
- enforce idempotency;
- control cost, latency, and provider usage;
- prevent cross-project data leakage;
- return safe progress and error information.

## High-level architecture

```text
HTTP or Application Command
            ↓
Orchestration Service
            ↓
Authorization and Idempotency
            ↓
Generation Plan Builder
            ↓
Context Assembly
            ↓
Job Queue
            ↓
Stage Runner
            ↓
Structured Validation
            ↓
Quality Gates and Approval States
            ↓
Revision Writer
            ↓
Preview or Export Jobs
```

## Main services

```ts
interface AIOrchestrator {
  startBriefAnalysis(input: StartBriefAnalysisInput): Promise<JobReference>;
  startOutlineGeneration(input: StartOutlineGenerationInput): Promise<JobReference>;
  startPresentationGeneration(input: StartPresentationGenerationInput): Promise<JobReference>;
  interpretCommand(input: InterpretCommandInput): Promise<CommandInterpretation>;
  applyCommand(input: ApplyCommandInput): Promise<JobReference | RevisionReference>;
  resumeAfterApproval(input: ResumeJobInput): Promise<JobReference>;
  cancelJob(input: CancelJobInput): Promise<void>;
}
```

Supporting services:
- `GenerationPlanBuilder`
- `ContextAssembler`
- `StageRegistry`
- `StageRunner`
- `ModelRouter`
- `RetrievalService`
- `PromptRegistry`
- `QualityGateService`
- `RevisionWriter`
- `JobService`
- `UsageRecorder`
- `AuditRecorder`

## Orchestration state machine

```ts
type OrchestrationState =
  | "queued"
  | "loading-context"
  | "processing-inputs"
  | "waiting-for-clarification"
  | "building-story"
  | "waiting-for-outline-approval"
  | "planning-slides"
  | "writing-content"
  | "directing-visuals"
  | "composing-layouts"
  | "reviewing-quality"
  | "repairing"
  | "writing-revision"
  | "completed"
  | "failed"
  | "cancelled";
```

State transitions must be explicit, validated, and persisted. A job must not skip a required approval state.

## Generation plans
A generation plan describes which stages run, in what order, and which may run in parallel.

```ts
interface GenerationPlan {
  id: string;
  type: "brief" | "outline" | "presentation" | "slide-edit" | "deck-edit" | "admin-rule";
  steps: GenerationPlanStep[];
  inputRevisionId?: string;
  targetPresentationId?: string;
  approvalPoints: ApprovalPoint[];
  maximumRepairPasses: number;
}
```

Each plan step includes:
- stage ID;
- stage version;
- dependencies;
- retry policy;
- timeout;
- cache policy;
- required context keys;
- output schema;
- approval requirement;
- whether the step is deterministic or model-dependent.

## Stage registry
All stages are registered by stable ID and version.

Required initial stages:
- `input-processor`
- `brief-interpreter`
- `clarifying-question-planner`
- `story-architect`
- `slide-planner`
- `content-writer`
- `visual-director`
- `layout-composer`
- `quality-reviewer`
- `command-scope-resolver`
- `command-intent-interpreter`
- `admin-rule-interpreter`

```ts
interface StageRegistry {
  get<Input, Output>(stageId: string, version: string): GenerationStage<Input, Output>;
  list(): RegisteredStage[];
}
```

Unknown or unpublished stage versions must fail before job execution.

## Stage runner

```ts
interface StageRunner {
  run<Input, Output>(request: RunStageRequest<Input, Output>): Promise<StageExecutionResult<Output>>;
}
```

The runner is responsible for:
- loading prompt templates;
- selecting a model route;
- constructing provider input;
- applying timeout and retry policy;
- validating structured output;
- recording stage runs;
- returning warnings and usage;
- never writing presentation revisions directly.

## Context assembly
The Context Assembler builds a scoped `GenerationContext` for each stage.

```ts
interface GenerationContext {
  requestId: string;
  jobId: string;
  user: AuthorizedActor;
  project: ProjectSummary;
  presentation?: PresentationSummary;
  revision?: PresentationDocument;
  brief?: PresentationBrief;
  narrative?: NarrativePlan;
  template?: ResolvedTemplateFamily;
  adminRules: ResolvedAdminRules;
  brand: ResolvedBrandPolicy;
  sources: RetrievedSourceChunk[];
  assets: RetrievedAssetSummary[];
  priorStageOutputs: Record<string, unknown>;
  featureFlags: FeatureFlags;
}
```

Context principles:
- load only data required by the current stage;
- never include another user's project data;
- do not place entire file archives into prompts;
- prefer retrieved excerpts over full documents;
- include stable IDs and provenance;
- redact secrets and unnecessary personal information;
- preserve explicit project and revision boundaries.

## Retrieval
The Retrieval Service selects relevant source material, brand guidance, examples, and historical context.

```ts
interface RetrievalService {
  retrieveForBrief(input: BriefRetrievalInput): Promise<RetrievedContext>;
  retrieveForSlide(input: SlideRetrievalInput): Promise<RetrievedContext>;
  retrieveBrandRules(input: BrandRuleRetrievalInput): Promise<ResolvedAdminRules>;
  retrieveTemplateExamples(input: TemplateExampleRetrievalInput): Promise<TemplateExample[]>;
}
```

Retrieval ranking should combine:
- semantic relevance;
- explicit source links;
- asset type;
- project ownership;
- recency where useful;
- approval status;
- template family;
- slide purpose;
- hard filters such as industry or visual type.

Retrieved content must carry:
- source ID;
- project ID;
- asset or document reference;
- page, slide, or section location;
- extraction timestamp;
- confidence;
- authorization scope.

## Prompt registry
Base prompts must be version-controlled.

```ts
interface PromptDefinition {
  stageId: string;
  version: string;
  systemTemplate: string;
  inputSchemaId: string;
  outputSchemaId: string;
  examples: PromptExample[];
  modelRequirements: ModelRequirements;
  evaluationSuiteIds: string[];
}
```

Admin rules are injected as structured policy data. They do not replace source-controlled stage instructions.

Prompt changes require:
- version increment;
- evaluation run;
- documented rationale;
- rollback path.

## Model routing
The Model Router chooses a provider/model capability route without exposing provider-specific names to domain code.

```ts
interface ModelRoute {
  id: string;
  capability: "classification" | "reasoning" | "writing" | "vision" | "image-generation";
  qualityTier: "fast" | "standard" | "high";
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  maximumInputTokens: number;
  timeoutMs: number;
  estimatedCostClass: "low" | "medium" | "high";
}
```

Routing inputs:
- stage requirements;
- prompt and source size;
- desired latency;
- user or environment feature flags;
- quality threshold;
- provider availability;
- cost ceiling;
- retry attempt.

Do not route confidential tasks to unapproved providers.

## Parallel execution
Safe parallelism may reduce generation time.

Examples:
- after the outline is approved, content writing for independent slides may run in parallel;
- visual direction may run after each slide's content is available;
- asset retrieval may run in parallel with slide planning when dependencies allow;
- quality review should wait until the complete draft is assembled.

Parallel steps must not:
- write competing revisions;
- mutate shared state;
- use stale template versions;
- exceed provider or cost limits;
- produce nondeterministic slide ordering.

Use a fan-out/fan-in pattern with stable slide IDs and sequence numbers.

## Job queue and workers
Recommended production architecture:
- web service submits jobs;
- Redis-backed queue stores lightweight job references;
- worker service executes jobs;
- PostgreSQL stores durable job and stage state;
- private object storage holds files and generated assets.

Job payloads should contain IDs, hashes, and small configuration objects, not confidential documents or binaries.

Workers must:
- claim jobs atomically;
- renew leases or heartbeats;
- stop when cancellation is requested;
- persist stage completion before advancing;
- recover safely after process restart;
- avoid duplicate revision writes.

Sprint 1 may use an in-process deterministic fake queue.

## Idempotency
Every orchestration request requires an idempotency key for operations that create jobs, revisions, images, or exports.

Recommended normalized key input:

```text
actor ID
+ operation type
+ presentation ID
+ expected revision ID
+ normalized request hash
+ prompt versions
+ template version
```

If the same key and payload are received again:
- return the existing job or result;
- do not create duplicate assets, revisions, or usage events.

If the same key is reused with a different payload, return a conflict.

## Revision concurrency
Every editing or generation operation targeting an existing presentation must include `expectedRevisionId`.

Before writing a revision:
1. re-read the current revision pointer;
2. compare it with the expected revision;
3. reject with a typed conflict if different;
4. never overwrite a newer revision silently.

Long-running jobs may complete against a stale revision. In that case, return a conflict result and allow the user to retry or duplicate from the generated result.

## Structured output validation
Every model-dependent stage output must pass a stage-specific Zod schema.

Validation process:
1. parse structured output;
2. validate required fields;
3. validate IDs and references;
4. validate content limits;
5. validate source and claim links;
6. reject unknown critical enum values;
7. produce machine-readable validation errors.

A validation retry should include only the necessary error feedback and original task context.

Do not use unsafe string-repair heuristics to coerce malformed output into persisted application state.

## Retry policy
Retry categories:

### Transient provider failure
Examples:
- timeout;
- connection failure;
- temporary 5xx;
- provider throttling.

Behavior:
- exponential backoff;
- jitter;
- provider-aware retry-after handling;
- optional route failover to an approved equivalent.

### Structured validation failure
Behavior:
- retry with validation errors;
- keep the same stage version;
- limit retries;
- record all attempts.

### Quality-gate failure
Behavior:
- run targeted repair stages;
- do not rerun the entire pipeline automatically;
- stop after maximum repair passes;
- surface unresolved warnings.

Do not retry:
- authorization failures;
- unsupported file types;
- policy violations;
- blocked users;
- invalid template references;
- exhausted user quota;
- explicit cancellation.

## Timeouts
Each stage declares a timeout. Timeouts should differ by task class:
- classification and normalization: short;
- story architecture: medium;
- slide generation: medium;
- image generation: long;
- full-deck quality review: medium;

A timed-out stage must not be assumed to have failed safely until provider state and idempotency are reconciled.

## Approval points
Required approval states:
- clarifying questions or fallback assumptions;
- outline approval;
- ambiguous high-impact deck-wide edit;
- template-family switch when it remaps multiple layouts;
- administrator rule publication;
- final publish or export.

Approval state includes:
- job ID;
- approval type;
- proposed structured change;
- impact summary;
- warnings;
- expiration or invalidation conditions;
- approving actor.

If the presentation changes before approval, the proposal should be revalidated against the new revision.

## Quality gates
The Quality Gate Service evaluates stage outputs and full drafts.

```ts
interface QualityGateResult {
  status: "pass" | "warn" | "fail";
  scores: Record<string, number>;
  blockers: QualityIssue[];
  warnings: QualityIssue[];
  repairPlan?: RepairPlan;
}
```

Quality dimensions:
- objective clarity;
- audience relevance;
- narrative coherence;
- evidence integrity;
- unsupported claims;
- unresolved assumptions;
- wording quality;
- slide density;
- template compatibility;
- visual relevance;
- image realism;
- accessibility;
- export compatibility.

Blocking thresholds should be configuration-driven and versioned.

## Repair loops
Repair should target the responsible stage.

Examples:
- weak narrative transition → Story Architect;
- headline too long → Content Writer;
- layout density violation → Slide Planner or Layout Composer;
- irrelevant image direction → Visual Director;
- unsupported export effect → Layout Composer.

Each repair pass must record:
- issue IDs;
- target stage;
- previous output reference;
- repaired output;
- whether the issue was resolved.

Maximum repair passes should be low and configurable to prevent runaway cost.

## Conversational editing

### Pipeline

```text
Instruction
  ↓
Scope Resolver
  ↓
Intent Interpreter
  ↓
Command Proposal
  ↓
Impact and Conflict Check
  ↓
Optional Confirmation
  ↓
Targeted Stage Execution
  ↓
Quality Gate
  ↓
New Revision
```

### Scope resolution
Possible scopes:
- selected element;
- selected slide;
- multiple selected slides;
- section;
- entire deck;
- template family;
- brand rule.

The current UI selection may resolve ambiguous references such as “this image” or “this slide.”

### Deterministic vs model-dependent commands
Deterministic commands:
- reorder slides;
- delete slide;
- duplicate slide;
- resize known element;
- change fixed text to explicitly supplied text;
- change template selection.

Model-dependent commands:
- make slide more persuasive;
- shorten the deck;
- create a more visual version;
- rewrite for executives;
- generate a new image;
- expand a topic into two slides.

Deterministic commands should avoid unnecessary model calls.

## Caching
Cache only when correctness and privacy are preserved.

Cache candidates:
- source extraction by file checksum;
- image analysis by asset checksum and prompt version;
- template example retrieval;
- brand-rule resolution by published version;
- stage output for identical normalized input, prompt version, and context hash;
- quality evaluations for immutable revisions.

Cache keys must include:
- stage ID and version;
- normalized input hash;
- relevant source checksums;
- admin-rule version;
- template version;
- model route;
- schema version.

Never reuse cached content across users unless the content is explicitly global and non-confidential.

## Cost controls
Record estimated and actual usage by:
- user;
- project;
- presentation;
- job;
- stage;
- provider route;
- image generation request;
- export.

Cost controls may include:
- maximum source-context size;
- stage-specific model tiers;
- per-job cost ceiling;
- maximum repair passes;
- image-generation limits;
- monthly presentation quotas;
- admin overrides;
- user-visible warnings for unusually expensive requests.

The testing phase may allow unlimited generations while still recording usage.

## Context-window management
The orchestrator must not send the full project history to every stage.

Use:
- normalized brief summaries;
- targeted retrieval;
- source chunk selection;
- prior-stage structured outputs;
- relevant slide subset;
- stable IDs and references.

For deck-wide edits:
- provide the complete outline and compact slide summaries;
- send full slide documents only when needed;
- process independent slide rewrites in bounded batches.

## Source and claim traceability
The orchestrator must preserve traceability through all stages.

Every claim should retain:
- claim ID;
- classification;
- source IDs;
- confidence;
- slide references;
- assumption status when applicable.

A stage may rephrase a claim but must not remove its source relationship.

## Prompt-injection resistance
Uploaded files, images, and pasted text are untrusted content.

Defenses:
- isolate source content from system instructions;
- label source excerpts explicitly;
- tell stages not to follow instructions found in source material;
- strip active content from files where possible;
- detect suspicious instruction-like text;
- do not expose tools or credentials to source-processing prompts;
- validate outputs against project goals and schemas;
- test with adversarial fixtures.

## Privacy and data handling
- Do not place confidential content in generic logs.
- Store prompts and stage outputs only in authorized project records.
- Redact secrets and personal identifiers from telemetry.
- Use approved provider data-retention settings before confidential pilot use.
- Respect 24-hour source-file expiry.
- Do not retrieve expired assets.
- Do not allow administrators to browse confidential project content by default.

## Observability
Track per job and stage:
- state transitions;
- queue latency;
- execution latency;
- model route;
- token or unit usage;
- estimated cost;
- retries;
- validation failures;
- quality scores;
- cache hits;
- approval wait time;
- cancellation;
- final outcome.

Use correlation IDs across HTTP request, job, stage run, revision, and export.

Do not store hidden model reasoning. Store structured outputs, warnings, scores, and decisions.

## Failure model
Typed orchestration errors:
- `ORCHESTRATION_PLAN_INVALID`
- `ORCHESTRATION_STAGE_NOT_FOUND`
- `ORCHESTRATION_CONTEXT_MISSING`
- `ORCHESTRATION_STALE_REVISION`
- `ORCHESTRATION_APPROVAL_REQUIRED`
- `ORCHESTRATION_CANCELLED`
- `ORCHESTRATION_TIMEOUT`
- `ORCHESTRATION_PROVIDER_FAILED`
- `ORCHESTRATION_SCHEMA_INVALID`
- `ORCHESTRATION_QUALITY_FAILED`
- `ORCHESTRATION_COST_LIMIT_EXCEEDED`
- `ORCHESTRATION_RETRY_EXHAUSTED`

Errors returned to users should explain the next action without revealing provider internals or confidential data.

## Cancellation
Cancellation is best effort.

When requested:
- mark job cancellation requested;
- stop scheduling new stages;
- cancel provider calls where supported;
- allow in-flight immutable results to complete safely;
- do not write a final revision after cancellation unless already committed;
- clean up temporary assets;
- record usage already incurred.

## Recovery after worker failure
On restart:
- inspect processing jobs with expired leases;
- resume from the last durably completed stage;
- do not rerun committed stages unless idempotent and required;
- verify whether provider-side operations completed;
- prevent duplicate image or revision creation.

## Testing strategy

### Unit tests
- generation-plan validation;
- state transitions;
- context scoping;
- idempotency;
- retry classification;
- approval invalidation;
- model routing;
- cache-key generation;
- cost calculation;
- stale-revision conflicts.

### Integration tests
- complete mocked brief-to-draft flow;
- slide-specific edit;
- deck-wide edit;
- job pause and resume after approval;
- transient provider retry;
- structured-output repair;
- worker restart recovery;
- cancellation;
- prompt-injection fixture;
- cross-user isolation.

### Evaluation tests
- brief interpretation;
- clarifying-question usefulness;
- narrative quality;
- layout selection;
- content density;
- visual relevance;
- source traceability;
- revision preservation.

## Recommended source structure

```text
src/ai/
  orchestration/
    orchestrator.ts
    generation-plan.ts
    state-machine.ts
    context-assembler.ts
    quality-gates.ts
    repair-planner.ts
  stages/
    input-processor/
    brief-interpreter/
    clarifying-questions/
    story-architect/
    slide-planner/
    content-writer/
    visual-director/
    layout-composer/
    quality-reviewer/
    commands/
  prompts/
    registry.ts
    definitions/
  routing/
    model-router.ts
    routes.ts
  retrieval/
    retrieval-service.ts
  providers/
    interfaces.ts
    mock.ts
    openai.ts
  evaluation/
    fixtures/
    runners/
```

## Sprint 1 requirements
Codex should implement:
- orchestrator interfaces;
- generation-plan types;
- explicit state-machine skeleton;
- stage registry;
- stage input and output placeholder schemas;
- mock stage implementations;
- deterministic fake queue;
- mock model router;
- prompt registry structure;
- context assembler using demo data;
- basic quality-gate interfaces;
- idempotency utilities;
- tests for state transitions, retries, stale revisions, and cross-user isolation;
- no live OpenAI requests.

## Live AI milestone
The first live-AI milestone should support:
1. brief normalization;
2. clarifying questions;
3. outline generation;
4. outline approval;
5. slide planning and writing for one template family;
6. targeted slide edits;
7. quality review;
8. usage and cost recording.

Do not add image generation or full-deck parallelism until the text and outline pipeline is stable and evaluated.

## Definition of done
The orchestrator is production-ready when:
- every stage is versioned and schema-validated;
- jobs resume safely after worker failure;
- duplicate requests do not create duplicate outputs;
- stale revision conflicts are handled explicitly;
- approval points cannot be bypassed;
- targeted edits preserve unaffected slides;
- cost and usage are observable;
- prompt injection tests pass;
- confidential context remains project-scoped;
- evaluation thresholds are enforced;
- provider failures are typed and recoverable;
- the same job can be traced from request through revision and export.
