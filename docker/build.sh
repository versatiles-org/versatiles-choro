#!/bin/bash

# go to the directory of this project
cd "$(dirname "$0")/.."

# Use Buildx with GHA-compatible cache
docker buildx build \
  --tag versatiles-choro:latest \
  --file docker/Dockerfile \
  --load \
  .
