# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Never model `charge.config` as INI.** charge-lnd parses it with Python's ConfigParser using `ExtendedInterpolation` (`${section:key}`), dotted keys (`chan.min_capacity`, `node.id`), comma- and `file://`-lists, and **ordered** user-named sections with cascading semantics — a section without `strategy` masks properties onto later matches. An INI model corrupts all of that on round trip and strips comments. It is `FileHelper.string`, validated with upstream's own parser.
- **Validate through `charge-lnd --check` on a candidate file, never in TypeScript.** `.charge.config.candidate` is deliberately _not_ the watched model, so an invalid submission never restarts the daemon.
- **`.lastRun` must stay its own file.** Daemon state in `settings.json` previously caused restart loops and clobbered user settings — the daemon's write tripped the watch on the user's config.
- **The daemon is a scheduler loop, not the tool.** charge-lnd is one-shot; the loop runs it, records the time on success, and sleeps. Keep the short retry on failure — it is what lets the service start before LND and recover without waiting a full interval.
- **The admin macaroon is required and cannot be downgraded.** charge-lnd calls `UpdateChannelPolicy` and `UpdateChanStatus`; a lesser macaroon fails at the RPC.
- **Dropping the `--grpc` flag when LND's address is unresolved is intentional.** LND publishes its gRPC binding only after a first unlock; the run then fails, the retry loop absorbs it, and the `.const()` heals `main` onto the real address once it appears.
- **The seeded config is fully commented out on purpose.** charge-lnd treats a config with no active sections as a no-op, so a fresh install never silently rewrites channel fees. Don't ship a working default policy.
