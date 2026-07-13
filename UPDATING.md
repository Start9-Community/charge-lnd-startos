# Updating the upstream version

charge-lnd publishes no Docker image and is not on PyPI. The image is built from upstream source at a pinned git tag (no `dockerTag` in the manifest — the manifest uses `dockerBuild`), so the upstream pin is the `--branch v<version>` argument on the `git clone` line in `Dockerfile`.

## Determining the upstream version

- **charge-lnd** — [accumulator/charge-lnd](https://github.com/accumulator/charge-lnd). Query the **tags**, not the releases:
  ```bash
  gh api repos/accumulator/charge-lnd/tags --jq '.[0].name'
  ```

  > [!WARNING]
  > **Do not use `gh release view` on this repo.** Upstream stopped cutting GitHub releases after the 0.2.x line — the 0.3.x tags exist but have no release attached. `gh release view -R accumulator/charge-lnd` returns **v0.2.13 (November 2022)**, which is *below* the current pin (v0.3.1). Following it would look like a new version and silently propose a **downgrade**. The tag list is the only source of truth here.

## Applying the bump

1. **`Dockerfile`** — bump the tag in `git clone --branch v<version> ...` to the new upstream tag.
2. **`startos/versions/current.ts`** — update `version` (e.g. `0.3.2:0` — the downstream revision resets to `0` for each new upstream version) and `releaseNotes` in place. A _new_ version file is only needed when the bump requires a migration — see [Versions](https://docs.start9.com/packaging/versions.html).
3. **`README.md` / `instructions.md`** — update if the bump changes anything user-visible (usually not required for simple version bumps).
4. Build (`make`) and test the new `.s9pk`.
