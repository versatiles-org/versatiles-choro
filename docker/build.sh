#!/bin/bash

# go to the directory of this project
cd "$(dirname "$0")/.."

# Ensure that all *.br files in testdata/ are decompressed
for file in testdata/*.br; do
  if [ ! -f "${file%.br}" ]; then
    echo "Decompressing $file"
    brotli --decompress "$file"
  fi
done

# Use Buildx with GHA-compatible cache
docker buildx build \
  --tag versatiles/versatiles-choro:latest \
  --file docker/Dockerfile \
  --cache-from type=gha \
  --cache-to type=gha,mode=max \
  --load \
  .
