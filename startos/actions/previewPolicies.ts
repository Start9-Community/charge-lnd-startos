import { manifest as lndManifest } from 'lnd-startos/startos/manifest'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  configPath,
  dataDir,
  escapeHtml,
  lndCertPath,
  lndMacaroonPath,
  lndMount,
  lndSocket,
  stripAnsi,
} from '../utils'

export const previewPolicies = sdk.Action.withoutInput(
  // id
  'preview-policies',

  // metadata
  async ({ effects }) => ({
    name: i18n('Preview Policies'),
    description: i18n(
      'Run charge-lnd in dry-run mode to see which channels would match which policies and what fees would be set. No fees are changed.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'charge-lnd' },
      sdk.Mounts.of()
        .mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: dataDir,
          readonly: true,
        })
        .mountDependency<typeof lndManifest>({
          dependencyId: 'lnd',
          volumeId: 'main',
          subpath: null,
          mountpoint: lndMount,
          readonly: true,
        }),
      'charge-lnd-preview',
      async (sub) =>
        sub.exec([
          'charge-lnd',
          '--dry-run',
          '-v',
          '--grpc',
          lndSocket,
          '--tlscert',
          lndCertPath,
          '--macaroon',
          lndMacaroonPath,
          '-c',
          configPath,
        ]),
    )

    const output = stripAnsi(
      [res.stdout.toString().trim(), res.stderr.toString().trim()]
        .filter(Boolean)
        .join('\n'),
    )

    if (res.exitCode !== 0) {
      throw new Error(
        output ||
          'charge-lnd exited with an error and no output. Is LND running?',
      )
    }

    return {
      version: '1',
      title: i18n('Dry Run Results'),
      message: output
        ? `<pre>${escapeHtml(output)}</pre>`
        : i18n(
            'No output. No channels matched your policies, or no changes would be made.',
          ),
      result: null,
    }
  },
)
