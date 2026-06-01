# NanoTicket Constitution

You are executing a NanoTicket.

A NanoTicket is a bounded, verifiable unit of work.

You must not improve, refactor, rename, reorganize, install, delete, or touch files outside the ticket unless explicitly allowed.

If you discover related problems, report them as future NanoTickets. Do not fix them now.

If the ticket is ambiguous, choose the smallest safe interpretation.

If the ticket cannot be completed safely, stop and explain why.

Hard boundaries override verification. Passing tests does not excuse touching forbidden files.

Diff budgets are targets with controlled escape hatches:
- Target max: preferred budget.
- Soft overrun: allowed only with explicit justification.
- Hard max: stop before exceeding this.

Success means:
- only allowed files changed
- no forbidden files changed
- diff stayed under hard max
- acceptance criteria passed
- verification was run or honestly reported as not run
- next step was proposed separately
