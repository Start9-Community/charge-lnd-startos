FROM python:3.11-slim

ARG CHARGE_LND_VERSION=v0.3.1
ARG CHARGE_LND_COMMIT=a218897bd2b3b4955cf0faa451036f81e2b484f1

# charge-lnd publishes no Docker image and is not on PyPI, so install from the
# upstream git tag, checked out at the commit it must resolve to (see
# UPDATING.md). Everything happens in one layer so git and the build tree don't
# bloat the image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && git clone --depth 1 --branch "$CHARGE_LND_VERSION" https://github.com/accumulator/charge-lnd.git /tmp/build \
  && git -C /tmp/build checkout -q --detach "$CHARGE_LND_COMMIT" \
  && test "$(git -C /tmp/build rev-parse "refs/tags/$CHARGE_LND_VERSION^{commit}")" = "$CHARGE_LND_COMMIT" \
  && pip install --no-cache-dir -r /tmp/build/requirements.txt /tmp/build \
  && apt-get purge -y git \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/* /tmp/build

WORKDIR /root
