// The pack's shape: 17 host skills and the vendor folders each one absorbs.
// Every vendor skill appears in exactly one host, or in DROPPED with a reason.
// A source is "<vendor>:<path under the vendor's skills root>".
//   matt   -> vendors/mattpocock/skills/<bucket>/<name>
//   pstack -> vendors/poteto/pstack/skills/<name>
// It is copied to .agents/skills/<host>/references/<vendor>/<name>/, with its
// SKILL.md renamed to <name>.md and its frontmatter stripped.

export const VENDORS = {
  matt: { root: "vendors/mattpocock/skills", license: "vendors/mattpocock/skills/LICENSE", pin: "49dd158d1076134a641b33efb035946536778336 (v1.3.1)" },
  pstack: { root: "vendors/poteto/pstack/skills", license: "vendors/poteto/pstack/LICENSE", pin: "d457567332aa6989e753ea289f30ea2bfbc80bc0 (v0.15.28)" },
};

const P = (...names) => names.map((n) => `pstack:principle-${n}`);

export const HOSTS = {
  // Advertised: the model or a child must reach these without a human.
  grilling: { advertised: true, sources: ["matt:productivity/grilling", "matt:productivity/grill-me", "matt:engineering/grill-with-docs", "matt:productivity/to-questionnaire", "pstack:in-your-own-words", "pstack:sharpen"] },
  "domain-modeling": { advertised: true, sources: ["matt:engineering/domain-modeling", ...P("model-the-domain")] },
  "codebase-design": {
    advertised: true,
    sources: ["matt:engineering/codebase-design", "pstack:architect", "pstack:arena", "pstack:typescript-best-practices",
      ...P("foundational-thinking", "exhaust-the-design-space", "subtract-before-you-add", "laziness-protocol", "minimize-reader-load",
        "boundary-discipline", "type-system-discipline", "redesign-from-first-principles", "migrate-callers-then-delete-legacy-apis",
        "make-operations-idempotent", "separate-before-serializing-shared-state")],
  },
  tdd: { advertised: true, sources: ["matt:engineering/tdd", "pstack:tdd", ...P("test-behavior-not-implementation")] },
  "diagnosing-bugs": { advertised: true, sources: ["matt:engineering/diagnosing-bugs", ...P("fix-root-causes", "attack-the-premise")] },
  "code-review": { advertised: true, sources: ["matt:engineering/code-review", "pstack:interrogate", "pstack:blast-radius", "pstack:no-comments"] },
  verify: {
    advertised: true,
    sources: ["pstack:create-verification-skill", "pstack:maintain-verification-skill", "pstack:create-formal-verification-skill",
      "pstack:maintain-formal-verification-skill", "pstack:benchmark-checklist", ...P("prove-it-works", "explain-the-number")],
  },
  research: { advertised: true, sources: ["matt:engineering/research", "pstack:how", "pstack:why", "pstack:recall"] },
  prototype: { advertised: true, sources: ["matt:engineering/prototype"] },
  writing: { advertised: true, sources: ["matt:productivity/writing-for-agents", "matt:engineering/pr", "pstack:technical-writing", "pstack:unslop"] },

  // User-invoked: a human types these.
  setup: { advertised: false, sources: ["matt:engineering/setup-matt-pocock-skills", "pstack:setup-pstack", "matt:engineering/wizard"] },
  rigor: {
    advertised: false,
    sources: ["matt:engineering/ask-matt", "matt:engineering/to-spec", "matt:engineering/to-tickets", "matt:engineering/implement",
      "matt:engineering/implement-spec", "matt:engineering/wayfinder", "matt:engineering/improve-codebase-architecture",
      "pstack:poteto-mode", "pstack:poteto-help", "pstack:figure-it-out", "pstack:swarm", "pstack:show-me-your-work",
      ...P("build-the-lever", "outcome-oriented-execution", "experience-first", "sequence-verifiable-units", "guard-the-context-window", "never-block-on-the-human")],
    // Vendor files outside any skill folder, kept for attribution and routing knowledge.
    extras: { "matt:engineering/README.md": "references/matt/engineering-README.md", "matt:productivity/README.md": "references/matt/productivity-README.md" },
  },
  triage: { advertised: false, sources: ["matt:engineering/triage"] },
  handoff: { advertised: false, sources: ["matt:productivity/handoff"] },
  retro: { advertised: false, sources: ["matt:engineering/retro", "pstack:reflect", "pstack:correct", "pstack:automate-me", ...P("encode-lessons-in-structure")] },
  "wait-what": { advertised: false, sources: ["matt:productivity/wait-what", "pstack:bro", "pstack:ketchup"] },
  teach: { advertised: false, sources: ["matt:productivity/teach", "pstack:teach"] },
};

// Codex `agents/openai.yaml` interface strings. The invocation policy is not
// listed here: it is derived from each host's SKILL.md frontmatter.
export const INTERFACE = {
  grilling: ["Grilling", "Interview a plan until nothing is assumed"],
  "domain-modeling": ["Domain Modeling", "Sharpen glossary terms and record ADRs"],
  "codebase-design": ["Codebase Design", "Deep modules, design exploration, principles"],
  tdd: ["TDD", "Test-driven red-green-refactor"],
  "diagnosing-bugs": ["Diagnosing Bugs", "Feedback loop first, then root cause"],
  "code-review": ["Code Review", "Standards, spec, adversarial and blast-radius lenses"],
  verify: ["Verify", "Prove changes work on the real artifact"],
  research: ["Research", "How, why, and primary-source research"],
  prototype: ["Prototype", "Throwaway code that answers one design question"],
  writing: ["Writing", "Agent docs, PR bodies, technical prose, unslop"],
  setup: ["Setup", "One-time repo configuration for the pack"],
  rigor: ["Rigor", "The one workflow: interview, then AFK build"],
  triage: ["Triage", "Move incoming issues through triage roles"],
  handoff: ["Handoff", "Pause, hand off, or pick up work"],
  retro: ["Retro", "Improve the agent's environment after a session"],
  "wait-what": ["Wait What", "Re-pitch or catch up in plain words"],
  teach: ["Teach", "Learn a concept or understand code"],
};

export const DROPPED = {
  "pstack:make-bot-ui": "Depends on Cursor routines, update_state and SendToUser; no equivalent on pi, Codex or Claude Code.",
};

// Vendor files never copied: per-harness interface metadata that the build
// regenerates per host from the host's own frontmatter.
export const EXCLUDE = [/(^|\/)agents\/openai\.yaml$/];
