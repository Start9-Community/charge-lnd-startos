# Updating the upstream version

charge-lnd publishes no Docker image and is not on PyPI. The image is built from upstream source at a pinned git tag (no `dockerTag` in the manifest — the manifest uses `dockerBuild`), so the upstream pin is the `--branch v<version>` argument on the `git clone` line in `Dockerfile`.

## Determining the upstream version

- **charge-lnd** — [accumulator/charge-lnd](https://github.com/accumulator/charge-lnd). The latest release and the latest tag are the same; either query works:
  ```bash
  gh release view -R accumulator/charge-lnd --json tagName -q .tagName
  gh api repos/accumulator/charge-lnd/tags --jq '.[0].name'
  ```

## Applying the bump

1. **`Dockerfile`** — bump the tag in `git clone --branch v<version> ...` to the new upstream tag.
2. **`startos/versions/current.ts`** — update `version` (e.g. `0.3.2:0` — the downstream revision resets to `0` for each new upstream version) and `releaseNotes` in place. A _new_ version file is only needed when the bump requires a migration — see [Versions](https://docs.start9.com/packaging/versions.html).
3. **`README.md` / `instructions.md`** — update if the bump changes anything user-visible (usually not required for simple version bumps).
4. Build (`make`) and test the new `.s9pk`.
