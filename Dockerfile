FROM python:3.11-slim

# charge-lnd publishes no Docker image and is not on PyPI, so install from the
# upstream git tag. The version pin lives on the `git clone --branch` line
# below (see UPDATING.md). Everything happens in one layer so git and the
# build tree don't bloat the image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && git clone --branch v0.3.1 --depth 1 https://github.com/accumulator/charge-lnd.git /tmp/build \
  && pip install --no-cache-dir -r /tmp/build/requirements.txt /tmp/build \
  && apt-get purge -y git \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/* /tmp/build

WORKDIR /root
