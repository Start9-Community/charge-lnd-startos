<p align="center">
  <img src="icon.png" alt="Charge LND Logo" width="21%">
</p>

# CHARGE-LND on StartOS

> **Upstream docs:** <https://github.com/accumulator/charge-lnd#readme>
>
> **Config examples:** <https://github.com/accumulator/charge-lnd/tree/master/examples>
>
> Everything not listed in this document should behave the same as upstream
> Charge-LND. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

Charge-LND is a command-line tool that matches your open Lightning channels against customizable criteria and applies channel fees based on matching policies. **charge-lnd is a background daemon with a configuration file — there is no interactive web UI.**

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Dependencies](#dependencies)
- [Actions](#actions)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

## Image and Container Runtime

| Property | Value |
|---|---|
| Base image | `python:3.11-slim` (built from local `Dockerfile`) |
| Install method | `pip install` from the upstream git tag pinned in `Dockerfile` (charge-lnd is not on PyPI and publishes no image) |
| Image source | `dockerBuild` (no official upstream StartOS image is published) |
| Architectures | x86_64, aarch64 |

The image installs `charge-lnd` globally via pip from a clone of the pinned upstream tag. We build from scratch to guarantee the container runs as `root`.

## Volume and Data Layout

| Volume | Mount Point | Purpose |
|---|---|---|
| `main` | `/data` | Holds the user-editable `charge.config` INI file and `settings.json`. |
| (LND dependency) | `/mnt/lnd` | Read-only access to LND TLS cert and admin macaroon. |

charge-lnd runs as root inside the container. This is required so it can read LND's root-owned `0600` `admin.macaroon`, which is mounted read-only and cannot be re-permissioned from this side.

**Key paths on the `main` volume:**
- `charge.config` — The INI file defining your fee policies (managed via the Edit Configuration action). Stored as raw text — charge-lnd's ConfigParser dialect (ExtendedInterpolation, dotted keys, ordered cascading sections, comments) does not survive a structured INI round trip.
- `settings.json` — Stores the run interval (user configuration only).
- `.lastRun` — Unix timestamp of the last successful run, written by the daemon loop and read by the health check. Kept separate from `settings.json` so daemon state never collides with user configuration.
- `.charge.config.candidate` — Transient scratch file used to validate submitted configs with `charge-lnd --check` before they are committed to `charge.config`.

## Installation and First-Run Flow

| Step | Upstream | StartOS |
|---|---|---|
| Installation | Build from source | Install from marketplace |
| LND connection | Manual CLI flags | Auto-injected via wrapper daemon loop |
| Configuration | Local text editor | StartOS Actions form |

**First-run steps:**
1. Install LND on StartOS and let it finish syncing.
2. Install charge-lnd from the marketplace. The install alert explains that it is a background daemon that ships with no active policies.
3. Open the **Actions** menu and click **Edit Configuration** to set your fee policies and run interval. The seeded `charge.config` is a fully commented-out example, so charge-lnd changes no fees until you define a policy.
4. Optionally run **Preview Policies** to see, without changing anything, which channels would match which policies.
5. Start the service. It connects to LND and applies your policies on the configured interval.

## Configuration Management

| Setting | Default | Purpose |
|---|---|---|
| `charge.config` | Commented-out example (no active policies) | User-defined INI file containing fee policies and channel matching criteria. |
| `settings.json` | `3600` seconds | How often the daemon loop executes `charge-lnd`. |
| `--tlscert` | `/mnt/lnd/tls.cert` | LND TLS certificate path (Locked by wrapper). |
| `--macaroon` | `/mnt/lnd/.../admin.macaroon` | LND admin macaroon path (Locked by wrapper). |
| `--grpc` | `lnd.startos:10009` | LND gRPC socket (Locked by wrapper). |

The LND connection parameters are locked to the correct paths for the bundled LND dependency. They are enforced by the wrapper's daemon loop, so the user only needs to manage the fee policies and timer via the StartOS Actions menu.

## Network Access and Interfaces

charge-lnd does **not** expose any network interface. It is a command-line tool that speaks to LND over the private `lnd.startos` gRPC socket. No ports are opened on the host, Tor, or LAN.
Access is via StartOS UI Actions only.

## Dependencies

| Dependency | Required | Purpose |
|---|---|---|
| LND | Required | Lightning node to manage. |

The LND `main` volume is mounted read-only into the charge-lnd container at `/mnt/lnd`. charge-lnd uses the admin macaroon, so all fee-management LND operations are available.

## Actions

The StartOS UI surfaces convenience actions. They exist so users can configure and inspect the daemon without SSH'ing in.

| Action | Purpose |
|---|---|
| Edit Configuration | Opens a native UI form to edit the `charge.config` INI and the run interval. The submitted config is first written to an unwatched candidate path and validated with upstream's own parser (`charge-lnd --check`); invalid configs are rejected with the parser error and nothing is saved. On success, `main.ts` watches both values reactively, so a running daemon restarts and applies the new policies immediately — no explicit restart in the action. |
| Preview Policies | Runs `charge-lnd --dry-run -v` in a temporary container and displays the (ANSI-stripped, HTML-escaped) output in a `<pre>` block: which channels match which policies and what fees would be set. Changes nothing. |

All other charge-lnd functionality is available from inside the container shell via SSH.

## Backups and Restore

**Included in backup:**
- `main` volume — `charge.config` fee policies and `settings.json` timer.

**Restore behavior:**
- Configuration restored; the daemon loop will automatically pick up the restored files on the next cycle or service restart.

**Note:** charge-lnd stores no funds. All funds reside in LND. Back up LND — not charge-lnd — to preserve your on-chain and channel state.

## Health Checks

| Check | Display Name | Method | Results |
|---|---|---|---|
| Primary daemon | Fee Policy Scheduler | Reads the `.lastRun` timestamp and the configured interval | `starting` until the first successful run; `success` with a live countdown to the next evaluation (or "evaluating now"); `failure` when the last run is more than 10 minutes overdue |

The daemon loop only writes `.lastRun` after a successful `charge-lnd` invocation, and retries failed runs every 60 seconds instead of waiting a full interval (e.g. when the service starts before LND is ready). The health check is therefore a pure file read — it never invokes `charge-lnd` or touches LND.

## Limitations and Differences

- **No web UI.** charge-lnd is configured via StartOS Actions and runs as a background daemon.
- **No external interfaces.** No Tor or LAN interface is declared; it speaks only to LND over the private `lnd.startos` gRPC socket.
- **Dynamic Timer.** The wrapper executes the upstream script based on a user-defined interval stored in `settings.json`.
- **No user LND config.** All connection settings are derived from the bundled LND dependency.

## What Is Unchanged from Upstream

- Every upstream policy matching logic and fee application feature.
- gRPC communication with LND via the admin macaroon.
- The INI configuration schema.

## Quick Reference for AI Consumers

```yaml
package_id: charge-lnd
upstream: https://github.com/accumulator/charge-lnd
image:
  source: dockerBuild (local Dockerfile)
  base: python:3.11-slim
architectures: [x86_64, aarch64]
volumes:
  main:
    charge.config: user fee policies (FileHelper.string; seeded with a commented-out example)
    settings.json: run interval (FileHelper.json)
    .lastRun: last successful run timestamp (written by daemon loop)
  mounts:
    - /mnt/lnd: lnd dependency volume (read-only)
interfaces: []
dependencies:
  lnd:
    kind: running
    versionRange: ">=0.20.1-beta:3"
    healthChecks: [lnd]
actions:
  - edit-config
  - preview-policies
health_checks:
  - primary: .lastRun timestamp vs configured interval (no LND calls)
backup_volumes:
  - main
fixed_config:
  cli_flags:
    tlscert: /mnt/lnd/tls.cert
    macaroon: /mnt/lnd/data/chain/bitcoin/mainnet/admin.macaroon
    grpc: lnd.startos:10009