# Multi-stage Dockerfile for VersaTiles Choro

FROM versatiles/versatiles-tippecanoe:latest AS tippecanoe

FROM node:24-alpine
RUN apk add --no-cache tini
COPY --from=tippecanoe /app/versatiles /usr/local/bin/
COPY --from=tippecanoe /usr/local/bin/tippecanoe /usr/local/bin/
WORKDIR /app
COPY package-lock.json package.json ./
COPY packages ./packages
COPY testdata/*.geojson ./data/
RUN npm install && npm run build
EXPOSE 8080
ENV DATA_PATH=/app/data
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/workbench/build/index.js"]
