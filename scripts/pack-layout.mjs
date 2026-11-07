// The pack's shape: 17 host skills and the vendor folders each one absorbs.
// Every vendor skill appears in exactly one host, or in DROPPED with a reason.
// A source is "<vendor>:<path under the vendor's skills root>".
//   matt   -> vendors/mattpocock/skills/<bucket>/<name>
//   pstack -> vendors/poteto/pstack/skills/<name>
// It is copied to .agents/skills/<host>/references/<vendor>/<name>/, with its
// SKILL.md renamed to <name>.md and its frontmatter stripped.

export const VENDORS = {
  matt: { root: "vendors/mattpocock/skills", license: "vendors/mattpocock/skills/LICENSE", pin: "4ae2317ddb22b046e26455e4f9c9b3aaaf62212d (v1.3.2)" },
  pstack: { root: "vendors/poteto/pstack/skills", license: "vendors/poteto/pstack/LICENSE", pin: "6b0300214a09fd6029cfb7077043125758cd1fd2 (v0.15.36)" },
};

const P = (...names) => names.map((n) => `pstack:principle-${n}`);

export const HOSTS = {
  // Advertised: the model or a child must reach these without a human.
  grilling: { advertised: true, sources: ["matt:productivity/grilling", "matt:engineering/grill-with-docs", "matt:productivity/to-questionnaire", "pstack:in-your-own-words", "pstack:sharpen"] },
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
      "pstack:maintain-formal-verification-skill", "pstack:statechart", "pstack:benchmark-checklist", ...P("prove-it-works", "explain-the-number")],
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
      "pstack:poteto-mode", "pstack:figure-it-out", "pstack:swarm", "pstack:show-me-your-work",
      ...P("build-the-lever", "outcome-oriented-execution", "experience-first", "sequence-verifiable-units", "guard-the-context-window", "never-block-on-the-human")],
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
  "pstack:make-bot-ui": "Depends on a routine runtime (update_state, SendToUser) that pi, Codex and Claude Code lack.",
  "pstack:poteto-help": "pstack's own product help (installing and running pstack in its original editor); no route in this pack uses it.",
  "pstack:ketchup-video": "Renders a slide video with no named renderer or encoder; ketchup (in wait-what) already covers the catch-up for AFK runs.",
};

// Vendor files never copied: per-harness interface metadata that the build
// regenerates per host from the host's own frontmatter.
export const EXCLUDE = [/(^|\/)agents\/openai\.yaml$/];

// Vendor files never copied because an installed pack cannot use them: upstream's
// own test suites. No copied script imports them (only the vendor `package.json`
// test scripts name them), they stay in vendors/ for the next upgrade, and the
// build records every skip in the manifest so check-pack still accounts for every
// vendor file. Matched against the path inside the skill folder, first match wins.
export const SKIPPED = [
  { match: /(^|\/)scripts\/test\//, reason: "upstream test suite folder (cases, fixtures, their helpers)" },
  { match: /(^|\/)[^/]+\.test\.ts$/, reason: "upstream unit test" },
  { match: /(^|\/)[^/]+\.test-helper\.ts$/, reason: "helper for the upstream unit tests" },
];
