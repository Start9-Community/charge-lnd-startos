import { chargeConfig } from '../fileModels/charge.config'
import { settingsJson } from '../fileModels/settings.json'
import { sdk } from '../sdk'
import { defaultConfig } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  // Ensure settings.json exists with defaults applied. On existing files
  // `merge({})` is a no-op (zod `.catch()` preserves every value present);
  // on fresh installs it materializes the file.
  await settingsJson.merge(effects, {})

  // Seed a fully commented-out example config on first install. charge-lnd
  // applies no policies (and changes no fees) until the user uncomments or
  // defines one, so a fresh install never silently rewrites channel fees.
  if (!(await chargeConfig.read().once())) {
    await chargeConfig.write(effects, defaultConfig)
  }
})
