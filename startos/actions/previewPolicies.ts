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
    allowedStatuses: 'only-stopped',
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

    const lines = output.split('\n')
    const channels: { header: string; details: string[] }[] = []
    let currentChannel: { header: string; details: string[] } | null = null
    let preChannelText: string[] = []
    let postChannelText: string[] = []
    let foundFirstChannel = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const isHeader = /^\d+x\d+x\d+/.test(trimmed)

      if (isHeader) {
        foundFirstChannel = true
        if (currentChannel) channels.push(currentChannel)
        currentChannel = { header: trimmed, details: [] }
      } else {
        if (currentChannel) {
          currentChannel.details.push(line)
        } else if (!foundFirstChannel) {
          preChannelText.push(line)
        } else {
          postChannelText.push(line)
        }
      }
    }
    if (currentChannel) channels.push(currentChannel)

    let bodyHtml = ''

    if (preChannelText.length > 0) {
      bodyHtml += `<pre>${escapeHtml(preChannelText.join('\n'))}</pre>`
    }

    if (channels.length > 0) {
      channels.forEach((ch) => {
        const headerMatch = ch.header.match(
          /^(\d+x\d+x\d+)\s+\[(.*)\|([^\]]+)\]$/,
        )
        let formattedHeader = escapeHtml(ch.header)
        if (headerMatch) {
          const [, chanId, alias, pubkey] = headerMatch
          formattedHeader = `<span class="g-warning">${escapeHtml(chanId)}</span> &nbsp;|&nbsp; <span class="g-primary">${escapeHtml(alias)}</span> <span class="g-secondary">${escapeHtml(pubkey)}</span>`
        }

        let detailsHtml = '<div>'
        for (const line of ch.details) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          const colonIndex = trimmedLine.indexOf(':')
          if (colonIndex > -1) {
            const key = trimmedLine.substring(0, colonIndex)
            const escapedValue = escapeHtml(
              trimmedLine.substring(colonIndex + 1).trim(),
            )

            const styledValue = escapedValue.replace(
              /(\d+)\s*➜\s*(\d+)/g,
              '<span class="g-info">$1 ➜ $2</span>',
            )

            detailsHtml += `<hr><span class="g-warning">${escapeHtml(key)}:</span> ${styledValue}\n`
          } else {
            detailsHtml += `<hr>${escapeHtml(trimmedLine)}\n`
          }
        }
        detailsHtml += '<hr></div>'

        bodyHtml += `
          <details>
            <summary>${formattedHeader}</summary>
            ${detailsHtml}
          </details>
        `
      })
    } else if (preChannelText.length === 0 && postChannelText.length === 0) {
      bodyHtml = `<pre>${escapeHtml(output)}</pre>`
    }

    if (postChannelText.length > 0) {
      bodyHtml += `<pre>${escapeHtml(postChannelText.join('\n'))}</pre>`
    }

    const htmlMessage = `
      <table class="g-table">
        <thead>
          <tr>
            <th>
              <span class="g-primary"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwMGZmYjAiPjx0aXRsZSB4bWxucz0iIiBmaWxsPSIjMDBmZmIwIj5jaGFubmVsPC90aXRsZT48cGF0aCBmaWxsPSIjMDBmZmIwIiBkPSJNMjAgMTZhMyAzIDAgMCAwLTEuNzMuNTZsLTIuNDUtMS40NUEzLjcgMy43IDAgMCAwIDE2IDE0YTQgNCAwIDAgMC0zLTMuODZWNy44MmEzIDMgMCAxIDAtMiAwdjIuMzJBNCA0IDAgMCAwIDggMTRhMy43IDMuNyAwIDAgMCAuMTggMS4xMWwtMi40NSAxLjQ1QTMgMyAwIDAgMCA0IDE2YTMgMyAwIDEgMCAzIDNhMyAzIDAgMCAwLS4xMi0uOGwyLjMtMS4zN2E0IDQgMCAwIDAgNS42NCAwbDIuMyAxLjM3QTMgMyAwIDEgMCAyMCAxNk00IDIwYTEgMSAwIDEgMSAxLTFhMSAxIDAgMCAxLTEgMW04LTE2YTEgMSAwIDEgMS0xIDFhMSAxIDAgMCAxIDEtMW0wIDEyYTIgMiAwIDEgMSAyLTJhMiAyIDAgMCAxLTIgMm04IDRhMSAxIDAgMSAxIDEtMWExIDEgMCAwIDEtMSAxIi8+PC9zdmc+" alt="channel" width="18" height="18"> CHANNELS</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${bodyHtml}
            </td>
          </tr>
        </tbody>
      </table>
    `

    return {
      version: '1',
      title: i18n('Dry Run Results'),
      message: output
        ? htmlMessage
        : i18n(
            'No output. No channels matched your policies, or no changes would be made.',
          ),
      result: null,
    }
  },
)