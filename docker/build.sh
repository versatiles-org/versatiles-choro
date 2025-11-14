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

# Build the Docker image for VersaTiles Choro
docker build -t versatiles/versatiles-choro:latest . -f docker/Dockerfile
