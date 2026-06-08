# Architecture Decision Records

See also the [documentation index](../README.md) and
[Architecture & Design Decisions](../ARCHITECTURE.md) walkthrough.

These ADRs follow [MADR 4.0.0](https://adr.github.io/madr/) and document the
load-bearing decisions in this repository. Each ADR is immutable once
accepted; supersede it with a new ADR instead of editing the existing one.

| #      | Title                                                      | Status                       |
| ------ | ---------------------------------------------------------- | ---------------------------- |
| `0001` | [Money as integer cents](./0001-money-as-cents.md)         | Accepted                     |
| `0002` | [Order status state machine](./0002-status-machine.md)     | Accepted                     |
| `0003` | [Order item snapshots](./0003-snapshots.md)                | Accepted                     |
| `0004` | [HttpOnly refresh-token cookie](./0004-httponly-cookie.md) | Accepted                     |
| `0005` | [Same-origin web topology](./0005-same-origin.md)          | Accepted                     |
| `0006` | [Locked stack](./0006-locked-stack.md)                     | Accepted                     |
| `0008` | [Cover imagery](./0008-cover-imagery.md)                   | Accepted                     |
| `0009` | [Web design system](./0009-design-system.md)               | Accepted (amended by `0010`) |
| `0010` | [Dark mode & palette](./0010-dark-mode-and-palette.md)     | Accepted                     |

## Authoring an ADR

1. Copy an existing file as a template.
2. Number it sequentially (zero-padded to 4 digits).
3. Fill in **Context**, **Decision**, **Consequences**, and link to the code
   that enforces the decision (services, migrations, tests).
4. Mark older ADRs as `Superseded by NNNN` rather than deleting them.
