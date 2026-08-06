# Administrator System

## Purpose
The administrator system allows authorized Kalpa administrators to manage access, publish global generation rules, maintain templates and brand assets, review usage, and audit important actions without editing application code.

## Roles
- Member: creates and edits personal projects.
- Admin: manages users, rules, templates, assets, and usage.
- Super Admin: may manage administrator roles and sensitive system settings.

Administrators should not automatically receive access to confidential user projects unless a future policy explicitly grants that permission.

## Admin dashboard
Show:
- active, suspended, and blocked users;
- current published rule-set versions;
- template-family status;
- asset-library status;
- generation and export usage;
- recent audit events;
- failed jobs and retention warnings.

## User management
Capabilities:
- search users by name or email;
- filter by role and status;
- activate, suspend, block, or restore;
- promote or demote administrators;
- view last login and high-level usage;
- record a reason for sensitive changes.

Every mutation creates an audit event. Blocked status overrides successful Google login.

## Rule categories
Global rules should be grouped into:
- brand identity;
- colors and typography;
- writing and terminology;
- narrative and storytelling;
- imagery;
- icons and diagrams;
- charts and data;
- templates and layouts;
- prohibited claims;
- export behavior.

## Rule proposal workflow
1. Administrator writes a freeform instruction.
2. AI converts it into a normalized, structured rule proposal.
3. System shows:
   - interpreted rule;
   - scope;
   - affected generation stages;
   - examples of changed behavior;
   - possible conflicts;
   - impact summary.
4. Administrator approves, revises, or cancels.
5. Approval publishes a new immutable rule version immediately.
6. Future generations use the new version.
7. Existing decks retain the version used unless explicitly upgraded.

Example instruction:
"Stop using images of professionals looking at transparent screens."

Normalized rule:
- category: imagery
- effect: prohibit
- pattern: transparent or floating interface interaction
- applies to: generated and retrieved imagery
- fallback: realistic interaction with physical screens, equipment, documents, or colleagues

## Rule model
Each rule should include:
- stable rule-set ID;
- version;
- category;
- title;
- normalized instruction;
- positive guidance;
- prohibited behavior;
- affected stages;
- priority;
- effective date;
- author and approver;
- status;
- examples;
- conflict notes.

## Rule conflicts
When a new rule conflicts with an existing rule:
- show both rules;
- explain the conflict;
- require explicit resolution;
- allow superseding, narrowing, or cancelling;
- never silently ignore a published rule.

Priority order:
1. Security and legal policy
2. Published organization rules
3. Template-family rules
4. Project instructions
5. Slide-specific instructions

## Brand management
Administrators can manage:
- approved logo variants;
- color tokens;
- font tokens and fallbacks;
- clear-space rules;
- default footers;
- legal notices;
- icon families;
- preferred visual examples;
- prohibited visual examples.

Changes create new brand-rule or template versions. Historical presentations must remain resolvable.

## Template management
Capabilities:
- view four template families;
- preview all layout types;
- create a draft version;
- update layout constraints and visual definitions;
- validate semantic tokens and export compatibility;
- test with sample decks;
- publish a version;
- retire a version from new use without breaking historical decks.

A template version cannot be published when required layouts are missing or validation fails.

## Asset-library management
Capabilities:
- upload brand assets;
- categorize and tag assets;
- approve or reject assets;
- mark preferred and unsuitable examples;
- assign expiration and licensing metadata;
- replace logo files;
- view usage references;
- remove assets from future retrieval.

Removing an asset from future use should not corrupt historical decks. Historical references should remain resolvable until retention or legal policy requires deletion.

## Prompt and generation management
Administrators can view:
- prompt-template versions;
- stage evaluation results;
- validation-failure rates;
- cost and latency summaries;
- accepted and rejected output feedback;
- active feature flags.

Base system prompts remain source-controlled. Admin rules augment them but do not replace core security or schema instructions.

## Output feedback
Administrators should be able to flag an output for:
- poor imagery;
- excessive text;
- weak narrative;
- incorrect terminology;
- logo misuse;
- bad charting;
- unsuitable layout;
- unsupported claims;
- export mismatch.

Feedback should create structured evaluation data and may inform future rules or test fixtures. It should not automatically retrain a model.

## Usage and quotas
During testing, generation is unlimited. The admin architecture must support:
- monthly presentation quotas;
- image-generation quotas;
- per-user overrides;
- role-based limits;
- usage reset dates;
- estimated cost reporting;
- warnings before enforcement.

The likely first production limit is ten presentations per user per month.

## Audit log
Audit events include:
- user status changes;
- role changes;
- rule proposals and publications;
- template publications;
- asset approvals or removals;
- feature-flag changes;
- retention purges;
- export downloads when required;
- administrator authentication events.

Audit views must not expose confidential project contents or secrets.

## Safety controls
Sensitive actions require confirmation:
- block user;
- demote administrator;
- publish rule;
- publish template;
- delete brand asset;
- alter retention policy;
- enable live provider integration.

Super-admin approval may be required later for high-impact settings.

## Admin testing sandbox
Administrators should be able to test a draft rule or template against a standard set of sample briefs before publication.

The sandbox should show:
- baseline result;
- proposed result;
- changed slides;
- visual and narrative scores;
- new warnings;
- token and cost estimate.

Sprint 1 needs only the UI shell and mock comparisons.

## Authorization requirements
- All admin routes require server-side role checks.
- The client must not receive controls it cannot use, but hidden controls are not a security boundary.
- Role changes should invalidate relevant sessions when necessary.
- Service identities may not use human admin routes.

## Sprint 1 requirements
Codex should implement:
- admin dashboard shell;
- users table with mock actions;
- rule proposal and approval UI;
- template and asset sections;
- usage and audit placeholders;
- admin service and repository interfaces;
- role-check helpers;
- mock immutable rule versions;
- tests ensuring members cannot access admin routes.
