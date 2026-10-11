---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple adversarial reviewer agents challenge changes from independent angles."
disable-model-invocation: true
---

# Interrogate

Spawn one reviewer per adversarial persona to review code changes. Each reviewer gets the same prompt, rubric, and a persona directive naming the angle it attacks from. In pi every reviewer shares the parent's model, so the adversarial signal comes from the personas, not model diversity.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that.
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset.
- If the user's message references recent work, gather the relevant files.

Package the diff or file contents with any surrounding context files the reviewers need to understand the code.

## Step 2, Intent

Before spawning reviewers, state the intent in one clear paragraph from the user's message, commit messages, the PR description if one exists, and the code. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Model tiering: **model choice is configuration, not a runtime decision.** This run is unattended - reviewers run on the reviewer tier configured in the agent definitions (`agentOverrides.model`/`thinking`); the conductor never picks a model at run time and never asks the user which model to use. Per-persona model diversity (the upstream design) is recovered the same way: configure different models per persona agent, once, in settings - not by reasoning about "strongest available" mid-run. If no reviewer tier is configured, the review agent runs on its own configured default model as-is - never handpick the root agent's model as the reviewer. Note the missing tier in the verdict: a limitation to report, not a question to ask.

Launch all reviewers in one pi `subagent` workflow, parallel, read-only (no edit/write tools), under the ceilings in the `subagent-orchestration-policy` skill. Default four personas; shrink or extend to fit the change:

| Reviewer | Persona: the angle it attacks from |
|----------|------------------------------------|
| A | Skeptic: assumes the change is wrong until the evidence proves otherwise; hunts unproven claims |
| B | Bug hunter: races, edge inputs, error paths, off-by-one, state leaks |
| C | Contract breaker: callers, schemas, API consumers, anything the change silently redefines |
| D | Simplifier: needless complexity, dead abstractions, speculative scaffolding the change added |

Read `references/reviewer-prompt.md` and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from `references/rubric.md`
4. The code-quality lens from `references/code-quality-review.md`
5. The persona directive from the table above, appended to the template

The same filled template goes to all reviewers, so every persona applies the code-quality lens; only the persona differs.

## Step 4, Synthesize

As results come back, build a unified picture. Parse every reviewer's findings. Merge findings that describe the same issue differently, and note which personas raised each one. Findings two or more personas raised independently are the highest signal. Read a lone persona's finding, but weight it accordingly. Note disagreements. If one persona flags something and another explicitly says the opposite, that is context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator. Read `references/lead-judgment.md` for the full framework. Put every finding in one of four buckets, with the persona(s) that raised it and a one-line rationale.

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. They would block a real PR.
- **Consider**. Legitimate, but you're not sure they outweigh the cost of addressing them now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact at this stage.
- **Dismissed**. Wrong, nitpicky, or missing context, with a brief reason.

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [persona], [N findings] (one bullet per reviewer)

### Act On
[Each: description, which personas raised it, why it matters.]

### Consider
[Each: description, which personas raised it, the tradeoff.]

### Noted
[Brief list.]

### Dismissed
[Each with a brief rationale.]

### Agreement Map
[Where personas agreed and diverged, and what that pattern tells us.]
