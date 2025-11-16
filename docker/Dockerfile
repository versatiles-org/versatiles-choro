FROM versatiles/versatiles-tippecanoe:latest AS tippecanoe



# ---------- Build stage ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY . ./

RUN \
  npm ci && \
  npm run build && \
  npm prune --omit=dev



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

COPY --from=tippecanoe /app/versatiles /usr/local/bin/
COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build --chmod=755 /app/build-cli/cli.mjs /app/build-cli/cli
COPY testdata/1_bundeslaender.geojson testdata/3_kreise.geojson ./data/

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