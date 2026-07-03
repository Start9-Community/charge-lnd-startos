import { sdk } from './sdk'

// charge-lnd is a background tool with no web UI. It exposes no network
// interfaces; it only speaks to LND over its gRPC endpoint on the LXC bridge.
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  return []
})
