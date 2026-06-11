import {
  chargeConfig,
  chargeConfigCandidate,
} from '../fileModels/charge.config'
import { settingsJson } from '../fileModels/settings.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { candidateConfigPath, dataDir, stripAnsi } from '../utils'

const { InputSpec, Value } = sdk

export const configInputSpec = InputSpec.of({
  interval: Value.number({
    name: i18n('Run Interval (Seconds)'),
    description: i18n(
      'How often Charge LND runs. Default is 3600 (1 hour). Minimum 60 seconds.',
    ),
    required: true,
    default: 3600,
    min: 60,
    integer: true,
  }),
  configText: Value.textarea({
    name: i18n('Fee Policies (charge.config)'),
    description: i18n('Define your routing policies in INI format.'),
    required: true,
    default: null,
  }),
})

export const editConfig = sdk.Action.withInput(
  // id
  'edit-config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Edit Configuration'),
    description: i18n(
      'Update your fee policies and run interval. If the service is running, changes are applied immediately.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  configInputSpec,

  // prefill
  async ({ effects }) => ({
    interval:
      (await settingsJson.read((s) => s.intervalSeconds).once()) ?? undefined,
    configText: (await chargeConfig.read().once()) ?? undefined,
  }),

  // execution
  async ({ effects, input }) => {
    // Validate the submitted config with upstream's own parser before
    // committing it. The candidate lives at an unwatched path, so an invalid
    // config never reaches the daemon. `--check` parses the file (including
    // ${section:key} interpolation) and exits before connecting to LND, so
    // this works whether or not LND is running.
    await chargeConfigCandidate.write(effects, input.configText)
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'charge-lnd' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: dataDir,
        readonly: true,
      }),
      'charge-lnd-check',
      async (sub) =>
        sub.exec(['charge-lnd', '--check', '-c', candidateConfigPath]),
    )
    if (res.exitCode !== 0) {
      const output = stripAnsi(
        [res.stdout.toString().trim(), res.stderr.toString().trim()]
          .filter(Boolean)
          .join('\n'),
      )
      // Parse failures surface as a Python traceback; show only the final
      // exception message (plus any indented detail lines that follow it),
      // not the stack frames.
      const lines = output.split('\n')
      let errStart = -1
      for (let i = lines.length - 1; i >= 0; i--) {
        if (/^\w[\w.]*(Error|Exception)\b/.test(lines[i])) {
          errStart = i
          break
        }
      }
      throw new Error(
        `Configuration was NOT saved — charge-lnd rejected it:\n${
          (errStart >= 0 ? lines.slice(errStart).join('\n') : output) ||
          'unknown parse error'
        }`,
      )
    }

    await chargeConfig.write(effects, input.configText)
    await settingsJson.merge(effects, { intervalSeconds: input.interval })

    // No explicit restart needed: main.ts watches both values reactively, so
    // a running daemon restarts and applies the new policies immediately.
    return {
      version: '1',
      title: i18n('Configuration saved'),
      message: i18n(
        'If Charge LND is running, your new policies are being applied now. Otherwise they will be applied the next time it starts.',
      ),
      result: null,
    }
  },
)
