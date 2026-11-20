# Updating the upstream version

charge-lnd publishes no Docker image and is not on PyPI. The image is built from upstream source at a pinned git tag (no `dockerTag` in the manifest — the manifest uses `dockerBuild`), so the upstream pin is the `CHARGE_LND_VERSION` (tag) and `CHARGE_LND_COMMIT` (the full commit SHA that tag must resolve to) args at the top of `Dockerfile`. The build checks the clone out at that commit and fails if the tag points anywhere else.

## Determining the upstream version

- **charge-lnd** — [accumulator/charge-lnd](https://github.com/accumulator/charge-lnd). Query the **tags**, not the releases:

  ```bash
  gh api repos/accumulator/charge-lnd/tags --jq '.[0].name'
  ```

  > [!WARNING]
  > **Do not use `gh release view` on this repo.** Upstream stopped cutting GitHub releases after the 0.2.x line — the 0.3.x tags exist but have no release attached. `gh release view -R accumulator/charge-lnd` returns **v0.2.13 (November 2022)**, which is _below_ the current pin (v0.3.1). Following it would look like a new version and silently propose a **downgrade**. The tag list is the only source of truth here.

## Applying the bump

**`Dockerfile`** — set `CHARGE_LND_VERSION` to the new upstream tag and `CHARGE_LND_COMMIT` to the full commit SHA it points to:

```bash
git ls-remote https://github.com/accumulator/charge-lnd.git 'refs/tags/v<version>*'
```

For an annotated tag the listing has two lines; take the commit from the one ending `^{}`. Upstream doesn't sign its tags, so there's no signature to check.
