import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  // How often (in seconds) the daemon loop runs charge-lnd.
  intervalSeconds: z.number().int().min(60).catch(3600),
})

export const settingsJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/settings.json' },
  shape,
)
