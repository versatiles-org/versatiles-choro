FROM versatiles/versatiles-tippecanoe:latest AS tippecanoe

# ---------- Build stage ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY . ./

RUN npm ci && npm run check && npm run build && npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:24-alpine

RUN apk add --no-cache tini sqlite-libs

COPY --from=tippecanoe /app/versatiles /usr/local/bin/
COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/

WORKDIR /app

COPY package-lock.json package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY testdata/1_bundeslaender.geojson testdata/3_kreise.geojson ./data/

# kill npm cache + root npm dir in the final stage
RUN npm cache clean --force && rm -rf /root/.npm

EXPOSE 8080
ENV NODE_ENV=production
ENV DATA_PATH=/app/data
	
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/workbench/build/index.js"]