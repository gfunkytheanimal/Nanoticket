# NanoTicket

Small, safe, verifiable task contracts for AI coding agents.

<<<<<<< HEAD
AI coding agents are powerful, but they drift. They edit too many files, refactor unrelated code, skip verification, and claim success without proof.

NanoTicket gives every agent a bounded task contract:

- exact objective
- allowed files
- forbidden files
- target diff budget
- soft overrun window
- hard max
- verification command
- acceptance criteria
- rollback plan
- completion report

It does not replace Codex, Claude Code, Gemini, Cursor, Copilot, or local agents. It keeps them on task.

## Install locally

```bash
# NanoTicket

Small, safe, verifiable task contracts for AI coding agents.

Install:

```bash
npm install -g @gfunkytheanimal/nanoticket
```

Then from any repo:

```bash
nanoticket init
nanoticket new "Fix arrow collision crash"
nanoticket validate nanotickets/001-fix-arrow-collision-crash.md
nanoticket audit nanotickets/001-fix-arrow-collision-crash.md
```


## Recommended workflow

Create or update the NanoTicket first, then commit or otherwise baseline it before asking an agent to implement the work. `nanoticket audit` is designed to inspect the implementation diff, not the creation of the ticket itself.

```bash
git add .nanoticket nanotickets
git commit -m "add nanoticket workflow"
# ask your AI agent to execute the ticket
nanoticket audit nanotickets/001-example.md
```

## Core idea

A NanoTicket is a tiny work order for an AI agent.

The agent may complete the work only inside the ticket's boundaries.

Hard boundaries fail the audit:

- touching forbidden files
- touching files outside `Files Allowed`
- exceeding hard diff max
- changing dependencies unless explicitly allowed
- missing required sections

Soft boundaries warn:

- exceeding target diff but staying inside soft overrun
- verification command not run/reported
- incomplete acceptance report


## Publish-ready npm package

Package name:

```bash
@gfunkytheanimal/nanoticket
```

Local development:

```bash
npm install
npm link
nanoticket help
```

Windows PowerShell may expose the linked shim as:

```powershell
nanoticket.cmd help
```

Test the package before publishing:

```bash
npm test
npm pack --dry-run
npm pack
```

Install the packed tarball locally:

```bash
npm install -g ./gfunkytheanimal-nanoticket-0.1.3.tgz
nanoticket help
```

Publish publicly to npm:

```bash
npm login
npm publish --access public
```

After publishing, install anywhere:

```bash
npm install -g @gfunkytheanimal/nanoticket
nanoticket help
```

## Commands

### `nanoticket init`

Creates:

```text
.nanoticket/
  config.json
  constitution.md
  templates/
    standard.md
nanotickets/
```

### `nanoticket new "Title"`

Creates a new ticket from the standard template.

### `nanoticket validate <ticket.md>`

Checks whether a ticket has the required sections and parseable scope.

### `nanoticket audit <ticket.md>`

Audits current git changes against the ticket:

- allowed files
- forbidden files
- changed line budget
- target/soft/hard max
- verification command presence
- acceptance criteria presence

By default, it audits unstaged and staged changes against `HEAD`.

## Example ticket

```md
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
- project.godot
- assets/**
- scenes/**

## Diff Budget
Target: 40 changed lines
Soft overrun: +10 changed lines with justification
Hard max: 55 changed lines

## Allowed Actions
- Read allowed files
- Edit allowed files
- Run existing local tests or manual scene checks

## Forbidden Actions
- No dependency changes
- No asset imports
- No scene rebuilds
- No unrelated refactors
- No formatting sweeps

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
- [ ] No crash on near-object arrow collision
- [ ] Arrow still collides with normal surfaces
- [ ] Only allowed files changed
- [ ] Diff stays within budget or justified soft overrun

## Rollback
Revert changes to the allowed files.

## Completion Report
- Changed files:
- Summary:
- Verification:
- Budget report:
- Acceptance:
- Follow-up NanoTicket:
```


## Windows note

In PowerShell, the linked command may be exposed as:

```powershell
nanoticket.cmd help
nanoticket.cmd init
nanoticket.cmd new "Fix arrow collision crash"
```

This is normal for npm-linked CLIs on Windows.
=======
