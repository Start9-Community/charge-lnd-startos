import { manifest as lndManifest } from 'lnd-startos/startos/manifest'
import { chargeConfig } from './fileModels/charge.config'
import { lastRun } from './fileModels/lastRun'
import { settingsJson } from './fileModels/settings.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  configPath,
  dataDir,
  lastRunPath,
  lndCertPath,
  lndMacaroonPath,
  lndMount,
  lndSocket,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Charge LND...'))

  const interval =
    (await settingsJson.read((s) => s.intervalSeconds).const(effects)) ?? 3600

  // Watch the policy file so the daemon restarts (and re-runs charge-lnd
  // immediately) when policies change via the Edit Configuration action,
  // instead of waiting for the next scheduled run. The daemon-written
  // .lastRun file lives outside this model, so these are the only two
  // triggers for a restart.
  await chargeConfig.read().const(effects)

  const mounts = sdk.Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: dataDir,
      readonly: false,
    })
    // LND volume (tls.cert + macaroons), readonly. See utils.ts for why the
    // admin macaroon is required.
    .mountDependency<typeof lndManifest>({
      dependencyId: 'lnd',
      volumeId: 'main',
      subpath: null,
      mountpoint: lndMount,
      readonly: true,
    })

  const chargeSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'charge-lnd' },
    mounts,
    'charge-lnd-sub',
  )

  /**
   * ======================== Daemons ========================
   */
  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: chargeSub,
    // charge-lnd is a one-shot CLI, so the daemon is a scheduler loop: run,
    // record the completion time of successful runs (read by the health check
    // below), then sleep for the configured interval. Failed runs (e.g. LND
    // not up yet) retry on a short fuse instead of waiting a full interval.
    exec: {
      command: [
        'sh',
        '-c',
        `while true; do if charge-lnd --grpc ${lndSocket} --tlscert ${lndCertPath} --macaroon ${lndMacaroonPath} -c ${configPath}; then date +%s > ${lastRunPath}; sleep ${interval}; else sleep 60; fi; done`,
      ],
    },
    ready: {
      display: i18n('Fee Policy Scheduler'),
      fn: async () => {
        const last = Number(await lastRun.read().once())
        if (!last) {
          return {
            result: 'starting',
            message: i18n(
              'Waiting for the first policy evaluation. If this persists, check the service logs.',
            ),
          }
        }
        const remaining = last + interval - Math.floor(Date.now() / 1000)
        if (remaining < -600) {
          return {
            result: 'failure',
            message: i18n(
              'The last scheduled evaluation appears to have failed. Check the service logs.',
            ),
          }
        }
        if (remaining <= 0) {
          return {
            result: 'success',
            message: i18n('Charge LND is evaluating channels now...'),
          }
        }
        return {
          result: 'success',
          message: i18n(
            'Charge LND is running — next evaluation in ${mins}m.',
            {
              mins: Math.ceil(remaining / 60),
            },
          ),
        }
      },
      gracePeriod: 15_000,
    },
    requires: [],
  })
})
