import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Deliberately a raw string, NOT FileHelper.ini: charge-lnd parses this file
// with Python's ConfigParser using ExtendedInterpolation (${section:key}
// references), dotted property keys (chan.min_capacity, node.id), comma- and
// file://-lists, and ORDERED user-named sections with cascading semantics
// (sections without `strategy` mask properties onto later matches). An INI
// model would corrupt all of that on round trip and strip comments. Validity
// is checked with upstream's own parser (`charge-lnd --check`) on save — see
// actions/editConfig.ts.
export const chargeConfig = FileHelper.string({
  base: sdk.volumes.main,
  subpath: '/charge.config',
})

// Scratch file for validating a submitted config with `charge-lnd --check`
// before committing it to charge.config. Deliberately NOT the watched model
// above, so an invalid candidate never restarts the daemon.
export const chargeConfigCandidate = FileHelper.string({
  base: sdk.volumes.main,
  subpath: '/.charge.config.candidate',
})
