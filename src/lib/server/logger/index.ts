/**
 * Logging Best Practices:
 *
 * 1. Always include context object as first parameter
 * 2. Use consistent property names: id, path, port, error
 * 3. Message should be imperative: "Starting server", "Converting file"
 * 4. Log at appropriate levels:
 *    - debug: Detailed diagnostic info
 *    - info: Normal operations
 *    - warn: Recoverable errors
 *    - error: Unrecoverable errors
 *
 * Examples:
 *   loggers.tiles.info({ id, port }, 'Starting tile server');
 *   loggers.conversion.error({ path, error }, 'Conversion failed');
 */
export { logger, createLogger, loggers } from './logger.js';
