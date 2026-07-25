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
