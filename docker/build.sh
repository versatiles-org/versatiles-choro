#!/bin/bash

# go to the directory of this project
cd "$(dirname "$0")/.."

./docker/prepare.sh

# Use Buildx with GHA-compatible cache
docker buildx build \
  --tag versatiles/versatiles-choro:latest \
  --file docker/Dockerfile \
  --load \
  .
