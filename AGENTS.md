# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Never model `charge.config` as INI.** charge-lnd parses it with Python's ConfigParser using `ExtendedInterpolation` (`${section:key}`), dotted keys (`chan.min_capacity`, `node.id`), comma- and `file://`-lists, and **ordered** user-named sections with cascading semantics — a section without `strategy` masks properties onto later matches. An INI model corrupts all of that on round trip and strips comments. It is `FileHelper.string`, validated with upstream's own parser.
- **Validate through `charge-lnd --check` on a candidate file, never in TypeScript.** `.charge.config.candidate` is deliberately _not_ the watched model, so an invalid submission never restarts the daemon.
- **`.lastRun` must stay its own file.** Daemon state in `settings.json` previously caused restart loops and clobbered user settings — the daemon's write tripped the watch on the user's config.
- **The daemon is a scheduler loop, not the tool.** charge-lnd is one-shot; the loop runs it, records the time on success, and sleeps. Keep the short retry on failure — it is what lets the service start before LND and recover without waiting a full interval.
- **The admin macaroon is required and cannot be downgraded.** charge-lnd calls `UpdateChannelPolicy` and `UpdateChanStatus`; a lesser macaroon fails at the RPC.
- **Dropping the `--grpc` flag when LND's address is unresolved is intentional.** LND publishes its gRPC binding only after a first unlock; the run then fails, the retry loop absorbs it, and the `.const()` heals `main` onto the real address once it appears.
- **The seeded config is fully commented out on purpose.** charge-lnd treats a config with no active sections as a no-op, so a fresh install never silently rewrites channel fees. Don't ship a working default policy.
