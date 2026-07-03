import { T } from '@start9labs/start-sdk'
import {
  gRPCHostId as lndGrpcHostId,
  gRPCInterfaceId as lndGrpcInterfaceId,
} from 'lnd-startos/startos/interfaces'
import { sdk } from './sdk'

export const lndMount = '/mnt/lnd' as const
export const dataDir = '/data' as const
export const configPath = `${dataDir}/charge.config` as const
export const candidateConfigPath =
  `${dataDir}/.charge.config.candidate` as const
export const lastRunPath = `${dataDir}/.lastRun` as const
export const lndCertPath = `${lndMount}/tls.cert` as const
// Using a less privileged macaroon is not sufficient because charge-lnd
// invokes LND policy-mutation RPCs (UpdateChannelPolicy, UpdateChanStatus).
export const lndMacaroonPath =
  `${lndMount}/data/chain/bitcoin/mainnet/admin.macaroon` as const
// Legacy DNS socket. Containers now reach each other over the LXC bridge (see
// readLndGrpcSocket); retained only as a fallback for the brief window before
// LND's gRPC bridge address resolves at startup.
export const lndSocketFallback = 'lnd.startos:10009' as const

/**
 * LND's gRPC `host:port` over the LXC bridge, resolved reactively. LND
 * terminates its own TLS and its StartOS-issued cert now covers the bridge
 * address, so we pin the https/ipv4 bridge variant. Returns the `sdk.host`
 * query — call `.const()` in setupMain (reactive) or `.once()` inside an
 * action. Replaces the deprecated `lnd.startos:10009` DNS socket.
 */
export const readLndGrpcSocket = (effects: T.Effects) =>
  sdk.host.get(
    effects,
    { hostId: lndGrpcHostId, packageId: 'lnd' },
    (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === lndGrpcInterfaceId)
      const addr =
        iface &&
        iface.addressInfo
          .filter({
            kind: 'bridge',
            predicate: (h) => h.ssl && h.metadata.kind === 'ipv4',
          })
          .hostnames[0]
      return addr ? `${addr.hostname}:${addr.port}` : undefined
    },
  )

// Seeded into charge.config on first install. Fully commented out: charge-lnd
// treats a config with no active sections as a no-op, so no fees are touched
// until the user deliberately defines policies via the Edit Configuration
// action.
export const defaultConfig = `# charge-lnd fee policies
#
# Policies are matched against each of your open channels; matching policies
# set that channel's routing fees. Until you define at least one (uncommented)
# policy section, charge-lnd makes no changes.
#
# Docs:     https://github.com/accumulator/charge-lnd#readme
# Examples: https://github.com/accumulator/charge-lnd/tree/master/examples
#
# Example — uncomment to apply a flat fee to all channels:
#
# [default]
# strategy = static
# base_fee_msat = 1_000
# fee_ppm = 10
`

/**
 * The StartOS UI renders action result messages as HTML, but its sanitizer
 * strips most tags and attributes. Escape command output first, then wrap in
 * `<pre>` — the combination that survives sanitization and renders monospace.
 */
export const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

// charge-lnd colors its output with ANSI escape codes (termcolor) even when
// stdout is not a TTY; strip them before displaying captured output.
export const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '')
