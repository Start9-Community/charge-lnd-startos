<p align="center">
  <img src="icon.png" alt="Charge LND Logo" width="21%">
</p>

# Charge LND on StartOS

> Everything not listed in this document should behave the same as upstream
> charge-lnd. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[charge-lnd](https://github.com/accumulator/charge-lnd) sets routing fees on your LND channels from policies you write. Upstream is a one-shot command you are expected to schedule yourself; this package turns it into a running service with a schedule, a way to edit and validate policies from the StartOS UI, and a dry run to check them before they touch anything.

- **Upstream repo:** <https://github.com/accumulator/charge-lnd>
- **Wrapper repo:** <https://github.com/Start9-Community/charge-lnd-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built here.

| Property      | Value                                         |
| ------------- | --------------------------------------------- |
| Image         | Built from this repo's `Dockerfile`           |
| Architectures | x86_64, aarch64                               |
| Command       | A shell scheduler loop, not the tool directly |

| Subcontainer     | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `charge-lnd-sub` | The only daemon — the one to `attach` to |

**Upstream is a one-shot CLI, so the "daemon" is a scheduler.** The command is a loop: run charge-lnd, record the time on success, sleep for the configured interval, repeat. A _failed_ run — LND not up yet, for instance — retries after a minute instead of waiting a full interval, so a service that starts before LND recovers on its own rather than idling until the next scheduled evaluation.

That timestamp file is the only thing the health check has to work from; there is no process to probe, because between runs there is nothing running.

## Volume and Data Layout

One volume, plus a read-only view of LND's.

| Volume            | Mount Point | Purpose                                       |
| ----------------- | ----------- | --------------------------------------------- |
| `main`            | `/data`     | Policies, the schedule setting, and run state |
| LND's `main` (ro) | `/mnt/lnd`  | LND's TLS certificate and admin macaroon      |

| Path                       | Written by | Holds                                |
| -------------------------- | ---------- | ------------------------------------ |
| `charge.config`            | An action  | The fee policies                     |
| `settings.json`            | An action  | The run interval                     |
| `.lastRun`                 | The daemon | Timestamp of the last successful run |
| `.charge.config.candidate` | An action  | Scratch space for validating an edit |

## File Models

Four models, and the choices between them are all deliberate.

| File                       | Format | Modelled                  | Written by                    |
| -------------------------- | ------ | ------------------------- | ----------------------------- |
| `charge.config`            | text   | Yes — `FileHelper.string` | The Edit Configuration action |
| `.charge.config.candidate` | text   | Yes — `FileHelper.string` | The same action, transiently  |
| `settings.json`            | JSON   | Yes — `FileHelper.json`   | The same action               |
| `.lastRun`                 | text   | Yes — `FileHelper.string` | The daemon loop               |

**`charge.config` is a raw string, not an INI model, and that is not laziness.** charge-lnd parses it with Python's ConfigParser using extended interpolation, dotted keys, comma- and file-lists, and **ordered, user-named sections with cascading semantics** — sections without a strategy mask properties onto later matches. An INI model would corrupt all of that on a round trip and strip every comment. So the package treats it as text and validates it with **upstream's own parser** instead.

**The candidate file exists so an invalid edit never reaches the daemon.** A submitted config is written there, checked with charge-lnd's own validator, and only promoted to the real file if it parses. The candidate is deliberately _not_ the watched model, so a rejected edit does not restart anything.

**`.lastRun` is its own file rather than a field in `settings.json`.** Daemon state and user configuration sharing a file previously caused restart loops and clobbered user settings — the daemon's write would trip the watch on the user's config.

`charge.config` and the interval **are** watched, so saving policies restarts the daemon and re-evaluates immediately rather than waiting out the current sleep.

## Dependencies

One, and it is required.

| Dependency | Required | Health checks required | Mounted                         | Why                     |
| ---------- | -------- | ---------------------- | ------------------------------- | ----------------------- |
| LND        | Yes      | `lnd`                  | `main`, read-only at `/mnt/lnd` | The channels it adjusts |

**This package uses LND's admin macaroon, and it needs it.** charge-lnd calls policy-mutation RPCs, which a lesser macaroon cannot authorize. Anyone who can reach this service's configuration can therefore change your channel policies — treat it accordingly.

LND's gRPC address is resolved over the internal bridge and passed to each run. **LND publishes that binding only once its wallet has been unlocked**, so until then the address resolves to nothing and the flag is simply omitted — charge-lnd fails to connect, the retry loop absorbs it, and the reactive read heals onto the real address when LND binds.

## Network Access and Interfaces

**None.** `setInterfaces` returns an empty array: this is a background tool with no web interface and nothing to expose.

Its only network traffic is outbound gRPC to LND over the internal bridge. Everything a user does with it is done through StartOS actions.

## Installation and First-Run Flow

Install seeds the interval and writes a **fully commented-out** example config.

That matters more than it sounds: charge-lnd treats a config with no active sections as a no-op, so a fresh install **changes no fees at all** until the user deliberately writes a policy. There is no default policy, and nothing is silently applied to your channels on day one.

The daemon starts immediately and begins its loop; with no active policies each run does nothing and simply records the time.

## Actions

Two actions.

### Edit Configuration

Edits the fee policies and the run interval. This is the only way to configure the service.

- **What it changes:** `charge.config` and the interval in `settings.json`.
- **Cost:** saving valid policies restarts the daemon, which re-evaluates **immediately** rather than at the next scheduled time. So a save is also a run.
- **Repeat safety:** idempotent.
- **Validation is real, not advisory.** The submitted config is written to a scratch file and parsed by charge-lnd itself; if it does not parse, the action fails and the live config is untouched. An invalid edit therefore cannot take your channels down.
- **What it does not check** is whether your policies do what you meant. Parsing is not intent — use Preview Policies for that.

### Preview Policies

A dry run: shows what the current policies _would_ do to each channel, without changing anything.

- **When to run it:** **only while stopped** — a dry run alongside the scheduler would be reading the same policies the loop is about to apply for real.
- **What it changes:** nothing. It is upstream's dry-run mode.
- **Repeat safety:** read-only.
- **Outputs:** charge-lnd's own output, with its color codes stripped and wrapped for display.

**The sequencing this implies is the useful part:** edit policies, stop the service, preview, then start it again once the output matches your intent.

## Tasks

None. This package raises no tasks, so the service is never held on a prompt and its ordinary controls are always available.

## Health Checks

One check, and it reads a timestamp rather than probing a process.

| Check     | Displayed as           | Method                             | Grace Period |
| --------- | ---------------------- | ---------------------------------- | ------------ |
| `primary` | "Fee Policy Scheduler" | The age of the last successful run | 15s          |

There is nothing listening to probe, so the check reasons about time instead:

- **No run yet** — reports as starting, with a note to check the logs if it persists. This is the normal state for the first few moments after install.
- **A run is due or in progress** — success.
- **The last run is more than ten minutes overdue** — failure, meaning evaluations are failing rather than merely slow.
- **Otherwise** — success, reporting how long until the next evaluation.

That ten-minute tolerance is what stops a single slow run from flapping the check, while still catching a loop that has genuinely stopped succeeding.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is the policies, the interval, and the last-run timestamp.

A restored instance resumes on the same schedule with the same policies. It needs LND present and unlocked on the new server before it can do anything; until then the retry loop waits, which is the same behavior as a fresh install without LND.

LND's own credentials are not backed up here — they belong to LND and are re-mounted from it.

## Limitations and Differences

1. **No web interface.** Everything is done through actions.
2. **The admin macaroon is required**, because policy changes cannot be made with a lesser one.
3. **Preview only runs while the service is stopped**, so checking a policy means pausing the scheduler.
4. **Validation checks syntax, not intent.** A config that parses can still set fees you did not mean.
5. **Mainnet only.** The macaroon path is pinned to Bitcoin mainnet.
6. **No policies are applied out of the box**, deliberately — the seeded config is entirely commented out.
7. **The schedule is a fixed interval**, not a calendar; there is no way to say "at 3am".

---

## Quick Reference for AI Consumers

```yaml
package_id: charge-lnd
image: built from ./Dockerfile
architectures:
  - x86_64
  - aarch64
subcontainers:
  - charge-lnd-sub
volumes:
  main: /data # LND's main volume is mounted read-only at /mnt/lnd
file_models:
  - charge.config # raw text; validated with charge-lnd --check
  - .charge.config.candidate # scratch, for validating an edit
  - settings.json # the run interval
  - .lastRun # daemon-written timestamp
startos_managed_env_vars: [] # everything is passed as CLI flags
dependencies:
  - lnd # required, kind: running, admin macaroon via a read-only mount
interfaces: {} # none declared
actions:
  - edit-config
  - preview-policies # only-stopped
tasks: []
health_checks:
  - primary # displayed "Fee Policy Scheduler"; reads .lastRun, no process to probe
```
