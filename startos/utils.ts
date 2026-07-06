import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

/**
 * Bridge address (`10.0.3.1:<assigned external port>`) of a dependency's
 * binding, as a minimal reactive value. Chain `.const()` in main: the mapped
 * string only changes when the address itself does, so main restarts exactly
 * on dependency install/uninstall/port-change and never on dependency
 * updates. Chain `.once()` in an action context. `fallbackPort` keeps the
 * value non-null while the dependency is absent — sanctioned only for tor's
 * allocator-guaranteed SOCKS 9050. Drop-in for the planned SDK
 * `sdk.host.getBridgeAddress` helper.
 */
export function bridgeAddress(
  effects: T.Effects,
  opts: {
    packageId: string
    hostId: string
    internalPort: number
    fallbackPort: number
  },
): { const(): Promise<string>; once(): Promise<string> }
export function bridgeAddress(
  effects: T.Effects,
  opts: { packageId: string; hostId: string; internalPort: number },
): { const(): Promise<string | null>; once(): Promise<string | null> }
export function bridgeAddress(
  effects: T.Effects,
  opts: {
    packageId: string
    hostId: string
    internalPort: number
    fallbackPort?: number
  },
) {
  const watchable = async () => {
    const osIp = await sdk.getOsIp(effects)
    return sdk.host.get(
      effects,
      { packageId: opts.packageId, hostId: opts.hostId },
      (host) => {
        const port =
          host?.bindings[opts.internalPort]?.net.assignedPort ??
          opts.fallbackPort
        return port != null ? `${osIp}:${port}` : null
      },
    )
  }
  return {
    const: async () => (await watchable()).const(),
    once: async () => (await watchable()).once(),
  }
}

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
