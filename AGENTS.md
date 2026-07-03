# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `charge-lnd`.** It is a background daemon with no network interface of its own. It is a dependent of `lnd`: it imports `gRPCHostId` / `gRPCInterfaceId` from `lnd-startos/startos/interfaces` to resolve LND's gRPC endpoint over the LXC bridge (see `readLndGrpcSocket` in `startos/utils.ts`), and mounts LND's `main` volume read-only at `/mnt/lnd` for the TLS cert + admin macaroon.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach charge-lnd -n charge-lnd-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `charge-lnd-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
