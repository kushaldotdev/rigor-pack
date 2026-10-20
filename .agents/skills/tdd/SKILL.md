---
name: tdd
description: "Test-driven development: red-green loop at agreed seams, and regression tests for bug fixes. Use when building features or fixing bugs test-first, writing or keeping a test, or the user says red-green-refactor."
---

# TDD

## Modes

| Mode | When | Body |
|---|---|---|
| build test-first (default) | Feature work and behaviour slices | [tdd](references/matt/tdd/tdd.md), with [tests](references/matt/tdd/tests.md) and [mocking](references/matt/tdd/mocking.md) |
| bug regression | A bug fix: decide whether it earns a new test | [tdd (pstack)](references/pstack/tdd/tdd.md) |
| what a test asserts | Writing, changing, or keeping any test | [principle-test-behavior-not-implementation](references/pstack/principle-test-behavior-not-implementation/principle-test-behavior-not-implementation.md) |

## Precedence

- Matt's `tdd` defines what a good test is. pstack's `tdd` decides whether a bug fix gets a new test. Prefer no test over a bad test, never over missing proof: without a test, record the closest executable check as evidence.
- Seams are "confirmed with the user" once. Inside a `rigor` run that confirmation happened in the interview: the seams are in the run brief. A seam the brief does not list is chosen at the highest existing seam and logged to the trail ([AFK.md](../rigor/AFK.md)).
- Upstream names resolve through [the name index](../rigor/references/INDEX.md).
