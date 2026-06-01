# NanoTicket {{NUMBER}} — {{TITLE}}

## Objective
One sentence describing the exact change.

## Why
Why this matters and what larger goal it supports.

## Files Allowed
- path/to/file.ext

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
What the agent must inspect before editing.

## Implementation Rules
Exact constraints. Smallest safe change only.

## Verification
Command: npm test
Manual: Describe any manual check required.

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
