// Harness-specific wording in the upstream pstack bodies, rewritten into neutral
// wording when render() in lib/pack.mjs copies them. The pack runs on pi, Codex CLI
// and Claude Code, so Cursor tool names, Cursor paths and hard-coded model slugs
// must not reach the copies. Keys are repo-relative vendor paths (the same as
// entry.src). Each value is an ordered list of [oldString, newString] pairs, applied
// after relinking. Every oldString must occur exactly once in that text, so upstream
// drift fails the build loudly instead of shipping Cursor wording.
const P = "vendors/poteto/pstack/skills/";

export const NEUTRAL = {
  [P + "poteto-mode/playbooks/opening-a-pr.md"]: [
    ["Multiple `Task` calls on the same branch", "Multiple child-agent spawns on the same branch"],
    ["Run `/deslop` from `cursor-team-kit` over the diff", "Run the **unslop** skill over the diff"],
  ],
  [P + "poteto-mode/playbooks/feature.md"]: [
    ["using your configured feature model (default `grok-4.7-xhigh-fast`)", "using the `feature, refactoring` role in `docs/agents/workflow.md` (default: the parent's model)"],
  ],
  [P + "reflect/references/judgment-reviewer.md"]: [
    ["(under `.cursor/skills/`, `~/.cursor/skills/`, or `~/.cursor/plugins/`), a `Task` prompt naming its path,", "(under `.agents/skills/`, the harness's user-level skills directory, or its plugins directory), a child-agent prompt naming its path,"],
  ],
  [P + "reflect/references/divergent-reviewer.md"]: [
    ["(under `.cursor/skills/`, `~/.cursor/skills/`, or `~/.cursor/plugins/`), a `Task` prompt naming its path,", "(under `.agents/skills/`, the harness's user-level skills directory, or its plugins directory), a child-agent prompt naming its path,"],
  ],
  [P + "reflect/references/tooling-reviewer.md"]: [
    ["(under `.cursor/skills/`, `~/.cursor/skills/`, or `~/.cursor/plugins/`), a `Task` prompt naming its path,", "(under `.agents/skills/`, the harness's user-level skills directory, or its plugins directory), a child-agent prompt naming its path,"],
  ],
  [P + "why/SKILL.md"]: [
    ["names a role line in the `pstack-models.mdc` rule and a default. Set `model` to that line's value, or to the default if the rule or the line is missing.", "names a role in `docs/agents/workflow.md` and a default. Set `model` to that role's value, or to the default if the file or the role is missing."],
    ["If the Task tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.", "If the harness rejects a slug, use the default and say so. If it rejects the default too, use the parent's model and say so."],
    ["list the available MCPs from the Cursor environment.", "list the MCP servers this session exposes."],
    ["Otherwise inspect the `mcps/` directory Cursor exposes for enabled MCP servers.", "Otherwise inspect the enabled MCP servers this session exposes."],
    ["`model`: the `why investigators` line, default `grok-4.7-xhigh-fast`.", "`model`: the `why investigators` role in `docs/agents/workflow.md`, default: the parent's model."],
    ["`model`: the `why synthesizer` line, default `claude-opus-5-5-xhigh`.", "`model`: the `why synthesizer` role in `docs/agents/workflow.md`, default: the parent's model."],
    ["Every spawn is `generalPurpose` with `readonly: false` (agent mode).", "Every spawn is a general-purpose child agent in agent mode (`readonly: false`)."],
  ],
  [P + "how/SKILL.md"]: [
    ["Every spawn is a Task subagent with `subagent_type: generalPurpose` and `readonly: true`.", "Every spawn is a general-purpose child agent, read-only where the harness supports it."],
    ["Explorers use the `how explorer` line in the `pstack-models.mdc` rule (default `grok-4.7-xhigh-fast`), and every explainer uses the `how explainer` line (default `claude-opus-5-5-xhigh`).", "Explorers use the `how explorer` role in `docs/agents/workflow.md` (default: the parent's model), and every explainer uses the `how explainer` role (default: the parent's model)."],
    ["Set `model` to that line's value, or to the default if the rule or the line is missing.", "Set `model` to that role's value, or to the default if the file or the role is missing."],
    ["If the Task tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.", "If the harness rejects a slug, use the default and say so. If it rejects the default too, use the parent's model and say so."],
  ],
  [P + "recall/SKILL.md"]: [
    ["Transcripts live at `~/.cursor/projects/<slug>/agent-transcripts/<uuid>/<uuid>.jsonl`, where `<slug>` is the workspace path with the leading slash dropped and each \"/\" turned into \"-\" (so `/Users/you/proj` becomes `Users-you-proj`).", "Transcripts live in the harness's transcript directory (listed in `rigor/harness/` notes), one folder per workspace."],
  ],
  [P + "poteto-mode/playbooks/hillclimb.md"]: [
    ["using your configured hillclimb model (default `grok-4.7-xhigh-fast`)", "using the `hillclimb` role in `docs/agents/workflow.md` (default: the parent's model)"],
  ],
  [P + "poteto-mode/playbooks/authoring-a-skill.md"]: [
    ["**create-skill** skill (Cursor's built-in for authoring SKILL.md files)", "**writing-for-agents** skill (for authoring SKILL.md files)"],
  ],
  [P + "interrogate/SKILL.md"]: [
    ["with the Task tool, one per entry on the `interrogate reviewers` line in `~/.cursor/rules/pstack-models.mdc`,", "with your harness's subagent tool, one per entry in the `interrogate reviewers` role in `docs/agents/workflow.md`,"],
    ["If the rule or that line is missing, use the table defaults.", "If the role is missing, use the table defaults."],
    ["| Reviewer A | `claude-opus-5-5-xhigh` |", "| Reviewer A | the parent's model |"],
    ["| Reviewer B | `grok-4.7-xhigh-fast` |", "| Reviewer B | a second model family if the harness has one; otherwise the parent's model, labeled single-family |"],
    ["Each reviewer gets `subagent_type: generalPurpose`, `readonly: true`, and `model` set to its configured entry,", "Each reviewer is a general-purpose child agent, read-only where the harness supports it, with `model` set to its configured entry,"],
    ["If the Task tool rejects a configured entry, run that reviewer on its family's table default and say so. Families go by prefix: `claude-*`, and `grok-*` with `cursor-grok-*` and `composer-*`. A refused `composer-*` entry runs on Reviewer B's default. With no family match, use Reviewer A's default. If it rejects a table default, spawn with the closest equivalent from the valid slugs in its error message (prefer the same family and reasoning tier), and open a separate PR to update the default table. Do not block the review on the slug issue. Never treat an alias entry as a rejected slug or apply either fallback to it.", "If the harness rejects a configured entry, run that reviewer on the parent's model and say so. Do not block the review on the slug issue. Never treat an alias entry as a rejected slug."],
  ],
  [P + "no-comments/SKILL.md"]: [
    ["Spawn `Task` with `subagent_type: \"comment-sicko\"`.", "Spawn a reviewer child agent whose brief is the Comments section of the **poteto-mode** skill (keep only non-obvious *why* comments)."],
    ["Spawn Comment Sicko. Act on accepted findings.", "Spawn a comment-review child agent (see step 1). Act on accepted findings."],
    ["Defer to Comment Sicko's fresh perspective.", "Defer to the reviewer child's fresh perspective."],
  ],
  [P + "show-me-your-work/SKILL.md"]: [
    ["under the active workspace's `agent-transcripts/` directory (the system prompt names the path).", "in the harness's transcript directory for the active workspace (listed in `rigor/harness/` notes)."],
    ["Don't glob across `~/.cursor/projects/*/`.", "Don't glob across other workspaces' transcript folders."],
  ],
  [P + "architect/SKILL.md"]: [
    ["Take the runners from the `architect runners` line in the `pstack-models.mdc` rule, in place of the `arena runners` line.", "Take the runners from the `architect runners` role in `docs/agents/workflow.md`, in place of the `arena runners` role."],
    ["If the rule or that line is missing, use `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`.", "If the role is missing, use a second model family if the harness has one; otherwise the parent's model, labeled single-family."],
  ],
  [P + "arena/SKILL.md"]: [
    ["Use the `arena runners` line in `~/.cursor/rules/pstack-models.mdc`. If the rule or that line is missing, default to one each on `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`.", "Use the `arena runners` role in `docs/agents/workflow.md`. If the role is missing, default to one each on a second model family if the harness has one; otherwise the parent's model, labeled single-family."],
    ["An `auto` or `inherit-parent` entry in this line or the cross-judge line", "An `auto` or `inherit-parent` entry in this role or the cross-judge role"],
    ["If the Task tool rejects a configured entry, run that seat on its family's default and say so. Families go by prefix: `claude-*`, and `grok-*` with `cursor-grok-*` and `composer-*`. A refused `composer-*` entry runs on `grok-4.7-xhigh-fast`. With no family match, use `claude-opus-5-5-xhigh`. If it rejects a default, use the closest valid slug of the same family from its error message.", "If the harness rejects a configured entry, run that seat on the parent's model and say so. If it rejects a default too, run on the parent's model."],
    ["Spawn all N subagents in one message with `run_in_background: true`,", "Spawn all N subagents in one message, in the background where the harness supports it,"],
    ["choose one model from the `arena cross-judge pool` line in `~/.cursor/rules/pstack-models.mdc`. If the rule or that line is missing, choose from `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`.", "choose one model from the `arena cross-judge pool` role in `docs/agents/workflow.md`. If the role is missing, choose from a second model family if the harness has one; otherwise the parent's model, labeled single-family."],
  ],
  [P + "swarm/SKILL.md"]: [
    ["Pick the worker model from the `swarm workers` line in `~/.cursor/rules/pstack-models.mdc`. If the rule or that line is missing, use `grok-4.7-xhigh-fast`.", "Pick the worker model from the `swarm workers` role in `docs/agents/workflow.md`. If the role is missing, use the parent's model."],
    ["If the Task tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.", "If the harness rejects a slug, use the default and say so. If it rejects the default too, use the parent's model and say so."],
    ["with `subagent_type: generalPurpose`, `environment: \"cloud\"`, `run_in_background: true`, and the step 4 model,", "as general-purpose child agents, each a remote/background child where the harness offers one, with the step 4 model,"],
    ["Use `environment: \"local\"` only when the worker needs", "Use a local child only when the worker needs"],
  ],
  [P + "reflect/SKILL.md"]: [
    ["find this conversation's transcript in the `agent-transcripts/` directory the system prompt names.", "find this conversation's transcript in the harness's transcript directory (listed in `rigor/harness/` notes)."],
    ["Do not glob across `~/.cursor/projects/*/`.", "Do not glob across other workspaces' transcript folders."],
    ["ls -t <agent-transcripts>/*.jsonl <agent-transcripts>/*/*.jsonl <agent-transcripts>/*/subagents/*.jsonl", "ls -t <transcript-dir>/*.jsonl <transcript-dir>/*/*.jsonl <transcript-dir>/*/subagents/*.jsonl"],
    ["One message, three `Task` calls, `subagent_type: generalPurpose`, agent mode", "One message, three child-agent calls, each a general-purpose child agent in agent mode"],
    ["name a role line in the `pstack-models.mdc` rule and a default. Set `model` to that line's value, or to the default if the rule or the line is missing.", "name a role in `docs/agents/workflow.md` and a default. Set `model` to that role's value, or to the default if the file or the role is missing."],
    ["If the Task tool rejects a slug, use the default and say so. If it rejects the default, use the closest valid slug of the same family from its error message.", "If the harness rejects a slug, use the default and say so. If it rejects the default too, use the parent's model and say so."],
    ["| Judgment | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/judgment-reviewer.md` |", "| Judgment | `reflect judgment, divergent, synthesizer` | the parent's model | `references/judgment-reviewer.md` |"],
    ["| Tooling | `reflect tooling` | `grok-4.7-xhigh-fast` | `references/tooling-reviewer.md` |", "| Tooling | `reflect tooling` | the parent's model | `references/tooling-reviewer.md` |"],
    ["| Divergent | `reflect judgment, divergent, synthesizer` | `claude-opus-5-5-xhigh` | `references/divergent-reviewer.md` |", "| Divergent | `reflect judgment, divergent, synthesizer` | the parent's model | `references/divergent-reviewer.md` |"],
    ["Reviewers return findings in the `Task` response body.", "Reviewers return findings in the child-agent response body."],
    ["One `Task` call, `subagent_type: generalPurpose`, `model` from the `reflect judgment, divergent, synthesizer` line (default `claude-opus-5-5-xhigh`),", "One child-agent call, a general-purpose child agent, `model` from the `reflect judgment, divergent, synthesizer` role in `docs/agents/workflow.md` (default: the parent's model),"],
    ["hand to Cursor's built-in `create-skill` skill", "hand to the **writing-for-agents** skill"],
  ],
  [P + "automate-me/SKILL.md"]: [
    ["Cursor's built-in `create-skill` (authoring)", "the **writing-for-agents** skill (authoring)"],
    ["Look recursively for `.cursor/skills/**/*-mode/SKILL.md` and `~/.cursor/skills/*-mode/SKILL.md`", "Look recursively for `.agents/skills/**/*-mode/SKILL.md` and the user-level skills directory's `*-mode/SKILL.md`"],
    ["(`.cursor/skills/<handle>/`)", "(`.agents/skills/<handle>/`)"],
    ["confirm intent with `AskQuestion` (unless they already said \"update my skill\" or similar):", "confirm intent with a structured multiple-choice question (the harness's question tool, if any), unless they already said \"update my skill\" or similar:"],
    ["The system prompt names the workspace's `agent-transcripts/` directory. Use only that path.", "Use only the harness's transcript directory for this workspace (listed in `rigor/harness/` notes)."],
    ["Don't glob across `~/.cursor/projects/*/`.", "Don't glob across other workspaces' transcript folders."],
    ["Use the `AskQuestion` tool (structured multi-choice) rather than", "Use a structured multiple-choice question (the harness's question tool, if any) rather than"],
    ["Use Cursor's built-in `create-skill` skill to author the skill.", "Use the **writing-for-agents** skill to author the skill."],
    ["use `.cursor/skills/<handle>/<handle>-mode/SKILL.md`", "use `.agents/skills/<handle>/<handle>-mode/SKILL.md`"],
    ["default to `.cursor/skills/<handle>-mode/SKILL.md`", "default to `.agents/skills/<handle>-mode/SKILL.md`"],
    ["(or `~/.cursor/skills/<handle>-mode/` if", "(or the user-level skills directory's `<handle>-mode/` if"],
  ],
  [P + "setup-pstack/SKILL.md"]: [
    ["Write `~/.cursor/rules/pstack-models.mdc`, an always-applied rule that sets pstack's model per role.", "Write the model roles in `docs/agents/workflow.md`, one line per role, that set pstack's model per role."],
    ["pass to a `Task` subagent in this session.", "pass to a child agent in this session."],
    ["If Cursor also exposes a models API or CLI", "If the harness also exposes a models API or CLI"],
    ["is the rule shape shown in step 5 below.", "is the shape shown in step 5 below."],
    ["If `~/.cursor/rules/pstack-models.mdc` already exists, read it and treat its `# budget` line and its role values as the current choices.", "If `docs/agents/workflow.md` already has model roles, read its `# budget` line and its role values as the current choices."],
    ["**(a) Ask for a budget.** Prefer AskQuestion over free text.", "**(a) Ask for a budget.** Prefer a structured multiple-choice question (the harness's question tool, if any) over free text."],
    ["So `unlimited` turns `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. Grok slugs top out at `xhigh`, so under `unlimited` the fallback puts Grok at `xhigh` and keeps `grok-4.7-xhigh-fast` as it is. `large` keeps both defaults. `small` turns them into `claude-opus-5-5-medium` and `grok-4.7-medium-fast`.", "So `unlimited` turns a `-xhigh` slug into its `-max` twin. Grok slugs top out at `xhigh`, so under `unlimited` the fallback puts Grok at `xhigh` and keeps its `-xhigh-fast` slug as it is. `large` keeps both defaults. `small` turns them into their `-medium` slugs."],
    ["as the options. Prefer AskQuestion over free text.", "as the options. Prefer a structured multiple-choice question (the harness's question tool, if any) over free text."],
    ["Write `~/.cursor/rules/pstack-models.mdc` with `alwaysApply: true`, a `# budget` line", "Write the model roles in `docs/agents/workflow.md`: a `# budget` line"],
    ["Overwrite the whole file so re-runs stay idempotent.", "Overwrite the roles so re-runs stay idempotent."],
    ["feature, refactoring: grok-4.7-xhigh-fast", "feature, refactoring: inherit-parent"],
    ["bug-fix: grok-4.7-xhigh-fast", "bug-fix: inherit-parent"],
    ["perf-issue: grok-4.7-xhigh-fast", "perf-issue: inherit-parent"],
    ["hillclimb: grok-4.7-xhigh-fast", "hillclimb: inherit-parent"],
    ["judgment and prose: claude-opus-5-5-xhigh", "judgment and prose: inherit-parent"],
    ["hardest tasks: claude-opus-5-5-xhigh", "hardest tasks: inherit-parent"],
    ["how explorer: grok-4.7-xhigh-fast", "how explorer: inherit-parent"],
    ["how explainer: claude-opus-5-5-xhigh", "how explainer: inherit-parent"],
    ["why investigators: grok-4.7-xhigh-fast", "why investigators: inherit-parent"],
    ["why synthesizer: claude-opus-5-5-xhigh", "why synthesizer: inherit-parent"],
    ["reflect tooling: grok-4.7-xhigh-fast", "reflect tooling: inherit-parent"],
    ["reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh", "reflect judgment, divergent, synthesizer: inherit-parent"],
    ["arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast", "arena runners: inherit-parent, inherit-parent"],
    ["arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast", "arena cross-judge pool: inherit-parent, inherit-parent"],
    ["swarm workers: grok-4.7-xhigh-fast", "swarm workers: inherit-parent"],
    ["architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast", "architect runners: inherit-parent, inherit-parent"],
    ["interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast", "interrogate reviewers: inherit-parent, inherit-parent"],
  ],
  [P + "poteto-mode/SKILL.md"]: [
    ["About to `AskQuestion` on", "About to ask a structured multiple-choice question (the harness's question tool, if any) on"],
    ["**create-skill** skill (Cursor's built-in for authoring SKILL.md files)", "**writing-for-agents** skill (for authoring SKILL.md files)"],
    ["the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`)", "the **unslop** skill"],
    ["→ the matching control skill. `cursor-team-kit` publishes `control-cli` (CLIs and TUIs) and `control-ui` (browser / Electron / web UIs).", "→ the repo's `verify-<app>` skill (CLIs, TUIs, browser, Electron and web UIs)."],
    ["not Cursor's built-in babysit skill,", "not any built-in babysit skill the harness ships,"],
    ["**Use `subagent_type: \"poteto-agent\"` for any subagent you spawn inside a playbook step**", "**Use a plain child agent given the brief for any subagent you spawn inside a playbook step**"],
    ["Never spawn a `poteto-agent` to run the playbook itself.", "Never spawn a plain child agent to run the playbook itself."],
    ["set their own `subagent_type` for diverse-model review. Respect what the skill prescribes, don't override to `poteto-agent`.", "choose their own child agents for diverse-model review. Respect what the skill prescribes, don't override to a plain child agent."],
    ["**Defaults for every `Task` call.** `run_in_background: true`, agent mode", "**Defaults for every child-agent call.** In the background where the harness supports it, agent mode"],
    ["explicit model per role (configurable via `/setup-pstack`. Defaults `grok-4.7-xhigh-fast` for code, `claude-opus-5-5-xhigh` for prose and judgment).", "explicit model per role (configurable in `docs/agents/workflow.md`. Default: the parent's model)."],
    ["go to your strongest judgment model (`claude-opus-5-5-xhigh`), whether", "go to your strongest judgment model (the parent's model unless its role says otherwise), whether"],
    ["Per-role lines in the `/setup-pstack` rule override", "Per-role lines in `docs/agents/workflow.md` override"],
    ["(omit Task `model`)", "(omit the child's `model`)"],
    ["comes from its line (", "comes from its role ("],
    ["(`grok-4.7-xhigh-fast` by default)", "(the parent's model by default)"],
    ["If the Task tool rejects the adjusted slug, do not try another adjusted slug. Use the role's line or default and say so.", "If the harness rejects the adjusted slug, do not try another adjusted slug. Use the role's value or default and say so."],
    ["going offline, a Cursor restart,", "going offline, a harness restart,"],
    ["so put this file's absolute path in every `poteto-agent` prompt.", "so put this file's absolute path in every child-agent prompt."],
  ],
  [P + "poteto-mode/playbooks/orchestrate.md"]: [
    ["only through the Task tool.", "only through the harness's subagent tool."],
    ["Always `environment: \"cloud\"` unless the task needs this machine: `control-ui` or `control-cli` runtime verification (from `cursor-team-kit`).", "Always a remote/background child where the harness offers one, unless the task needs this machine: runtime verification through the repo's `verify-<app>` skill."],
    ["Reading local transcripts under `agent-transcripts/`.", "Reading local transcripts in the harness's transcript directory."],
    ["the cloud agent's status in the Cursor dashboard.", "the child's status in the harness's agent status view."],
    ["After a Cursor restart: local agents are dead, cloud work is not.", "After a harness restart: local agents are dead, remote work is not."],
  ],
  [P + "poteto-mode/playbooks/session-pickup.md"]: [
    ["under the active workspace's `agent-transcripts/` directory (the system prompt names the path. Do not glob across `~/.cursor/projects/*/`, that crosses workspace boundaries and reads private chats from unrelated projects), a cloud-agent URL", "in the harness's transcript directory for the active workspace (listed in `rigor/harness/` notes). Do not glob across other workspaces' transcript folders, that crosses workspace boundaries and reads private chats from unrelated projects, a cloud-agent URL"],
  ],
  [P + "poteto-mode/playbooks/perf-issue.md"]: [
    ["using your configured perf-issue model (default `grok-4.7-xhigh-fast`)", "using the `perf-issue` role in `docs/agents/workflow.md` (default: the parent's model)"],
  ],
  [P + "poteto-mode/playbooks/bug-fix.md"]: [
    ["Drive a long or stubborn hunt with Cursor's `/loop` command.", "Drive a long or stubborn hunt with your harness's loop or scheduled-wakeup mechanism."],
    ["using your configured bug-fix model (default `grok-4.7-xhigh-fast`)", "using the `bug-fix` role in `docs/agents/workflow.md` (default: the parent's model)"],
  ],
  [P + "poteto-mode/playbooks/autonomous-run.md"]: [
    ["using Cursor's `/loop` command (a built-in, not a pstack skill)", "using your harness's loop or scheduled-wakeup mechanism (a built-in, not a pstack skill)"],
    ["or use `AskQuestion`.", "or use a structured multiple-choice question (the harness's question tool, if any)."],
  ],
  [P + "poteto-mode/playbooks/babysit.md"]: [
    ["This playbook replaces Cursor's built-in babysit skill for these requests", "This playbook replaces any built-in babysit skill the harness ships for these requests"],
  ],
  [P + "poteto-mode/playbooks/autopilot-full.md"]: [
    ["Each owner is a Cursor cloud agent that builds", "Each owner is a remote child agent (a local child where the harness offers no remote one) that builds"],
    ["the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`)", "the **unslop** skill"],
    ["through its control skill (such as `control-ui` or `control-cli` from `cursor-team-kit`)", "through the repo's `verify-<app>` skill"],
  ],
  [P + "poteto-mode/playbooks/eval.md"]: [
    ["under the active workspace's `agent-transcripts/` directory (the system prompt names this path).", "in the harness's transcript directory for the active workspace (listed in `rigor/harness/` notes)."],
    ["Do not glob across `~/.cursor/projects/*/`.", "Do not glob across other workspaces' transcript folders."],
  ],
  [P + "poteto-mode/playbooks/multi-phase-plan.md"]: [
    ["Explore in subagents with `subagent_type: \"poteto-agent\"`", "Explore in plain child agents given the brief"],
    ["on the `swarm workers` model (default `grok-4.7-xhigh-fast`)", "on the `swarm workers` model (default: the parent's model)"],
    ["Browser, Electron, and web UIs use `control-ui` from `cursor-team-kit`. CLIs and TUIs use `control-cli` from `cursor-team-kit`.", "Browser, Electron, web UIs, CLIs and TUIs all use the repo's `verify-<app>` skill."],
    ["Each live lane runs on its own cloud VM at the PR head. Drive through `control-ui` or `control-cli` from `cursor-team-kit`.", "Each live lane runs on its own remote child at the PR head. Drive through the repo's `verify-<app>` skill."],
  ],
  [P + "poteto-mode/playbooks/shipping.md"]: [
    ["each a Cursor cloud agent, runs the change the way a user would with the matching control skill (such as `control-ui` or `control-cli` from `cursor-team-kit`),", "each a remote child agent, runs the change the way a user would with the repo's `verify-<app>` skill,"],
  ],
  [P + "poteto-mode/playbooks/refactoring.md"]: [
    ["using your configured refactoring model (default `grok-4.7-xhigh-fast`)", "using the `feature, refactoring` role in `docs/agents/workflow.md` (default: the parent's model)"],
  ],
  [P + "poteto-mode/playbooks/worktree-cleanup.md"]: [
    ["misses one that lives at `.cursor/worktrees/myrepo/x`", "misses one that a harness keeps in its own worktree folder"],
    ["`~/Library/Application Support/Cursor` (`state.vscdb.backup`,", "`~/Library/Application Support/<editor>` (such as `state.vscdb.backup`,"],
  ],
  [P + "create-verification-skill/SKILL.md"]: [
    ["project-local skill (`.cursor/skills/verify-<app>/`)", "project-local skill (`.agents/skills/verify-<app>/`)"],
    ["Write `.cursor/skills/verify-<app>/SKILL.md`", "Write `.agents/skills/verify-<app>/SKILL.md`"],
    ["Create `.cursor/skills/verify-<app>/features/README.md`", "Create `.agents/skills/verify-<app>/features/README.md`"],
  ],
  [P + "maintain-verification-skill/SKILL.md"]: [
    ["(usually `.cursor/skills/verify-*/`)", "(usually `.agents/skills/verify-*/`)"],
  ],
};

// Keys that name no file in the copy plan (an upstream file moved or was dropped).
export const unknownNeutralKeys = (plan) => {
  const srcs = new Set(plan.entries.map((e) => e.src));
  return Object.keys(NEUTRAL).filter((k) => !srcs.has(k));
};
