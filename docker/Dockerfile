# Multi-stage Dockerfile for VersaTiles Choro

FROM versatiles/versatiles-tippecanoe AS versatiles-tippecanoe


FROM 24-alpine
WORKDIR /app
COPY --from=versatiles-tippecanoe /app .
EXPOSE 8080
CMD ["node", "server/dist/cli.js"]
