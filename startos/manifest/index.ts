import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'charge-lnd',
  title: 'Charge LND',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9-Community/charge-lnd-startos',
  upstreamRepo: 'https://github.com/accumulator/charge-lnd',
  marketingUrl: 'https://github.com/accumulator/charge-lnd',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    'charge-lnd': {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: false,
    },
  },
})
