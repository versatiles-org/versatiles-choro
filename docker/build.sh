#!/bin/bash

# go to the directory of this project
cd "$(dirname "$0")/.."

image_tag=${1:-versatiles-choro}

# Use Buildx with GHA-compatible cache
docker buildx build \
  --tag ${image_tag} \
  --file docker/Dockerfile \
  --load \
  .
