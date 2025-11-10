# Multi-stage Dockerfile for VersaTiles Choro
FROM alpine:latest AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM versatiles-tippecanoe
WORKDIR /app
COPY --from=builder /app .
RUN \
   apt-get update && \
	apt-get install -y wget && \
	rm -rf /var/lib/apt/lists/*
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
