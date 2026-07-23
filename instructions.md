# charge-lnd

## Documentation

- [charge-lnd README](https://github.com/accumulator/charge-lnd#readme) — upstream overview, policy matching logic, and strategy explanations.
- [charge-lnd Config Examples](https://github.com/accumulator/charge-lnd/tree/master/examples) — real-world INI configuration examples for various routing strategies.

## What you get on StartOS

- A background daemon that continuously evaluates and applies your Lightning routing fees based on customizable policies.
- Pre-wired to securely communicate with your LND node over its private gRPC socket — no manual macaroon or TLS certificate path editing required.
- A native StartOS UI form to easily edit your `charge.config` INI policies and adjust the background execution timer without touching the terminal.

## Getting set up

Charge LND is a background service with no user interface. Once you define policies, it automatically modifies the routing fees of your open Lightning channels. It installs with no active policies, however — until you define one, it changes nothing.

1. Ensure LND is installed, running, and fully synced on your StartOS server.
2. Navigate to **Actions** and click **Edit Configuration**. Set your desired run interval (e.g., `3600` for every hour) and write your routing policies into the text area, using the commented-out example as a starting point.
3. Click **Submit** to save. Your config is checked with charge-lnd's own parser first — if it contains a syntax error, nothing is saved and the error is shown.
4. Run **Preview Policies** to double-check, without changing any fees, which channels your policies match and what fees would be set.
5. Start the service. It applies your policies right away, then re-evaluates on your configured interval.

## Using charge-lnd

Charge LND operates entirely in the background. Once configured, it will automatically wake up on your defined interval, evaluate your open channels against your policies, and update your LND routing fees. The dashboard health check will display a live countdown to the next evaluation.

### Actions

The service page exposes two actions to manage everything directly from the dashboard:

- **Edit Configuration** — Opens a native UI form to edit your `charge.config` INI file and the run interval. If the service is running, your new policies are applied immediately; otherwise they take effect the next time it starts.
- **Preview Policies** — Runs charge-lnd in dry-run mode and shows you exactly which channels match which policies and what fees would be set, without changing anything. Use it to safely test policy edits and verify fee diffs before starting the service.