#!/bin/bash

# go to the directory of this project
cd "$(dirname "$0")/.."

# Build the Docker image for VersaTiles Choro
docker build -t versatiles/versatiles-choro:latest . -f docker/Dockerfile
