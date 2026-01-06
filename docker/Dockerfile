FROM versatiles/versatiles-tippecanoe:latest AS tippecanoe

# ---------- Rust builder stage (only used when BUILD_FROM_SOURCE=true) ----------
FROM rust:1-alpine AS rust-builder

ARG BUILD_FROM_SOURCE=false

# Only run the build if BUILD_FROM_SOURCE is true
# Always create /built-module with a .placeholder to ensure COPY doesn't fail
RUN mkdir -p /built-module && touch /built-module/.placeholder && \
  if [ "$BUILD_FROM_SOURCE" = "true" ]; then \
    apk add --no-cache git musl-dev nodejs npm python3 make g++ && \
    export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_MUSL_LINKER=gcc && \
    export CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=gcc && \
    git clone --depth 1 https://github.com/versatiles-org/versatiles-rs.git /versatiles-rs && \
    cd /versatiles-rs/versatiles_node && \
    npm install && \
    npm run build && \
    cp *.js *.cjs *.d.ts *.node package.json /built-module/; \
  fi



# ---------- Build stage ----------
FROM node:24-alpine AS build

ARG BUILD_FROM_SOURCE=false

WORKDIR /app
COPY . ./

# If building from source, remove the npm dependency before npm ci
RUN if [ "$BUILD_FROM_SOURCE" = "true" ]; then \
    npm pkg delete dependencies.@versatiles/versatiles-rs && \
    npm pkg delete optionalDependencies 2>/dev/null || true; \
  fi

# Install dependencies
RUN npm ci

# If building from source, copy the built native module into node_modules BEFORE build
COPY --from=rust-builder /built-module/ /tmp/built-module/
RUN if [ "$BUILD_FROM_SOURCE" = "true" ]; then \
    mkdir -p /app/node_modules/@versatiles/versatiles-rs && \
    cp /tmp/built-module/*.js /tmp/built-module/*.cjs /tmp/built-module/*.d.ts \
       /tmp/built-module/*.node /tmp/built-module/package.json \
       /app/node_modules/@versatiles/versatiles-rs/; \
  fi

# Sync SvelteKit types (needed for build-lib which reads tsconfig.json)
RUN npx svelte-kit sync

# Build the application and prune dev dependencies
RUN npm run build && npm prune --omit=dev

# Re-copy the built native module after prune (npm prune removes orphaned packages)
RUN if [ "$BUILD_FROM_SOURCE" = "true" ]; then \
    mkdir -p /app/node_modules/@versatiles/versatiles-rs && \
    cp /tmp/built-module/*.js /tmp/built-module/*.cjs /tmp/built-module/*.d.ts \
       /tmp/built-module/*.node /tmp/built-module/package.json \
       /app/node_modules/@versatiles/versatiles-rs/; \
  fi && \
  rm -rf /tmp/built-module



# ---------- Runtime stage ----------
FROM node:24-alpine

LABEL org.opencontainers.image.title="VersaTiles Choro"
LABEL org.opencontainers.image.url="https://github.com/versatiles-org/versatiles-choro"
LABEL org.opencontainers.image.source="https://github.com/versatiles-org/versatiles-choro"
LABEL org.opencontainers.image.documentation="https://github.com/versatiles-org/versatiles-choro"
LABEL org.opencontainers.image.authors="Michael Kreil <info@versatiles.org>"
LABEL org.opencontainers.image.base.name="node:24-alpine"
LABEL com.versatiles.warning="This project is under heavy development. Not for production."

RUN apk add --no-cache tini sqlite-libs

WORKDIR /app

COPY package-lock.json package.json ./

COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build --chmod=755 /app/build-cli/cli.mjs /app/build-cli/cli

# kill npm cache + root npm dir in the final stage
RUN \
  npm cache clean --force && \
  rm -rf /root/.npm

EXPOSE 8080
ENV NODE_ENV=production
ENV DATA_PATH=/app/data
ENV PATH="/app/build-cli/:${PATH}"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "build/index.js"]
