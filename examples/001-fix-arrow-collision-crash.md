# NanoTicket 001 — Fix arrow collision crash

## Objective
Prevent arrows from crashing the game when fired at nearby oven/cabinet collision objects.

## Why
Arrow physics is one of the most fun interactions in neighbor:hood, but near-object collision crashes break the sandbox loop.

## Files Allowed
- src/physics/projectiles.gd
- src/physics/collision_layers.gd

## Files Forbidden
- package.json
- package-lock.json
- node_modules/**
- .env
- .env.*
- dist/**
- build/**

## Diff Budget
Target: 40 changed lines
Soft overrun: +10 changed lines with justification
Hard max: 55 changed lines

## Allowed Actions
- Read allowed files
- Edit allowed files
- Run existing tests

## Forbidden Actions
- No dependency changes
- No deletes
- No unrelated refactors
- No formatting sweeps
- No generated file changes

## Preflight
Confirm the crash path is caused by near-object collision handling for arrows.

## Implementation Rules
- Use the smallest safe collision guard.
- Preserve existing arrow sticking/bounce behavior.
- Do not change player movement or input.

## Verification
Command: npm test
Manual: Fire an arrow at near collision objects 10 times without a crash.

## Acceptance Criteria
- [ ] Only allowed files changed
- [ ] Diff stays within hard max
- [ ] Verification passes or is honestly reported
- [ ] No unrelated behavior changed

## Rollback
Revert the changed allowed files.

## Completion Report
- Changed files:
- Summary:
- Verification:
- Budget report:
- Acceptance:
- Follow-up NanoTicket:
