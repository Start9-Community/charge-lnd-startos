export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Charge LND...': 0,
  'Fee Policy Scheduler': 1,
  'Waiting for the first policy evaluation. If this persists, check the service logs.': 2,
  'The last scheduled evaluation appears to have failed. Check the service logs.': 3,
  'Charge LND is evaluating channels now...': 4,
  'Charge LND is running — next evaluation in ${mins}m.': 5,

  // actions/editConfig.ts
  'Run Interval (Seconds)': 6,
  'How often Charge LND runs. Default is 3600 (1 hour). Minimum 60 seconds.': 7,
  'Fee Policies (charge.config)': 8,
  'Define your routing policies in INI format.': 9,
  'Edit Configuration': 10,
  'Update your fee policies and run interval. If the service is running, changes are applied immediately.': 11,
  'Configuration saved': 12,
  'If Charge LND is running, your new policies are being applied now. Otherwise they will be applied the next time it starts.': 13,

  // actions/previewPolicies.ts
  'Preview Policies': 14,
  'Run charge-lnd in dry-run mode to see which channels would match which policies and what fees would be set. No fees are changed.': 15,
  'Dry Run Results': 16,
  'No output. No channels matched your policies, or no changes would be made.': 17,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
