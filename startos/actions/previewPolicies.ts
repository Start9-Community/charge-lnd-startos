import { gRPCHostId, gRPCPort } from 'lnd-startos/startos/interfaces'
import { manifest as lndManifest } from 'lnd-startos/startos/manifest'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  configPath,
  dataDir,
  lndCertPath,
  lndMacaroonPath,
  lndMount,
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
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),

  // execution
  async ({ effects }) => {
    // LND's gRPC endpoint over the LXC bridge. Null while LND is absent or its
    // gRPC binding is not yet published: the --grpc flag is dropped and
    // charge-lnd fails to connect, surfacing the "Is LND running?" error below.
    const lndSocket = await sdk.host
      .getBridgeAddress(effects, {
        packageId: 'lnd',
        hostId: gRPCHostId,
        internalPort: gRPCPort,
      })
      .once()

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
          ...(lndSocket ? ['--grpc', lndSocket] : []),
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
        ? null
        : i18n(
            'No output. No channels matched your policies, or no changes would be made.',
          ),
      result: output
        ? { type: 'multiline', value: output, copyable: true }
        : null,
    }
  },
)
