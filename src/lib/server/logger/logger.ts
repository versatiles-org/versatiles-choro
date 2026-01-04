import pino from 'pino';

/**
 * Configure Pino logger based on environment
 */
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Disable logging during tests
const logLevel = isTest
	? 'silent'
	: ((process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')) as pino.Level);

/**
 * Base logger instance
 */
export const logger = pino({
	level: logLevel,
	transport: isDevelopment
		? {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'HH:MM:ss',
					ignore: 'pid,hostname',
					singleLine: false
				}
			}
		: undefined,
	formatters: {
		level: (label) => {
			return { level: label };
		}
	},
	timestamp: pino.stdTimeFunctions.isoTime
});

/**
 * Create a child logger for a specific module
 */
export function createLogger(module: string): pino.Logger {
	return logger.child({ module });
}

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
	api: createLogger('api'),
	server: createLogger('server'),
	process: createLogger('process'),
	filesystem: createLogger('filesystem'),
	conversion: createLogger('conversion'),
	tiles: createLogger('tiles'),
	progress: createLogger('progress'),
	error: createLogger('error')
};
