import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Unix timestamp of the last successful charge-lnd run, written by the daemon
// loop in main.ts after each successful evaluation. Kept in its own file —
// not in settings.json — so daemon state never collides with user
// configuration (writes to a shared file previously caused restart loops and
// clobbered user settings).
export const lastRun = FileHelper.string({
  base: sdk.volumes.main,
  subpath: '/.lastRun',
})
