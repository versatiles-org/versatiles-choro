import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	withErrorHandling,
	errorToResponse,
	logError,
	successResponse,
	errorResponse
} from './handler';
import {
	AppError,
	ValidationError,
	NotFoundError,
	PathTraversalError,
	FileSystemError,
	ProcessError,
	ConversionError,
	TileError
} from './errors';
import { ValiError } from 'valibot';
import * as v from 'valibot';

// Mock the logger
vi.mock('../logger/index.js', () => ({
	loggers: {
		error: {
			warn: vi.fn(),
			error: vi.fn()
		}
	}
}));

import { loggers } from '../logger/index.js';

describe('Error Handler', () => {
	let originalEnv: string | undefined;

	beforeEach(() => {
		originalEnv = process.env.NODE_ENV;
		vi.clearAllMocks();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.NODE_ENV;
		} else {
			process.env.NODE_ENV = originalEnv;
		}
	});

	describe('successResponse', () => {
		it('returns JSON response with default 200 status', () => {
			const data = { message: 'success' };
			const response = successResponse(data);

			expect(response.status).toBe(200);
		});

		it('returns JSON response with custom status code', () => {
			const data = { message: 'created' };
			const response = successResponse(data, 201);

			expect(response.status).toBe(201);
		});
	});

	describe('errorResponse', () => {
		it('returns error message from Error instance', () => {
			const error = new Error('Test error');
			const response = errorResponse(error);

			expect(response.status).toBe(500);
		});

		it('returns error message from string', () => {
			const response = errorResponse('String error');

			expect(response.status).toBe(500);
		});

		it('accepts custom status code', () => {
			const response = errorResponse('Not found', 404);

			expect(response.status).toBe(404);
		});
	});

	describe('withErrorHandling', () => {
		it('returns response on successful handler execution', async () => {
			const mockHandler = vi.fn(async () => successResponse({ data: 'test' }));
			const wrappedHandler = withErrorHandling(mockHandler);

			const mockEvent = {
				request: new Request('http://localhost/test'),
				route: { id: '/test' }
			} as any;

			const response = await wrappedHandler(mockEvent);

			expect(response.status).toBe(200);
			expect(mockHandler).toHaveBeenCalledWith(mockEvent);
		});

		it('catches and converts errors to responses', async () => {
			const testError = new ValidationError('Invalid input');
			const mockHandler = vi.fn(async () => {
				throw testError;
			});
			const wrappedHandler = withErrorHandling(mockHandler);

			const mockEvent = {
				request: new Request('http://localhost/test'),
				route: { id: '/test' }
			} as any;

			const response = await wrappedHandler(mockEvent);

			expect(response.status).toBe(400);
			expect(loggers.error.warn).toHaveBeenCalled();
		});

		it('logs errors with route context', async () => {
			const testError = new Error('Test error');
			const mockHandler = vi.fn(async () => {
				throw testError;
			});
			const wrappedHandler = withErrorHandling(mockHandler);

			const mockEvent = {
				request: new Request('http://localhost/api/test'),
				route: { id: '/api/test' }
			} as any;

			await wrappedHandler(mockEvent);

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					context: '/api/test'
				}),
				'Unexpected error'
			);
		});

		it('handles unknown route id', async () => {
			const testError = new Error('Test error');
			const mockHandler = vi.fn(async () => {
				throw testError;
			});
			const wrappedHandler = withErrorHandling(mockHandler);

			const mockEvent = {
				request: new Request('http://localhost/test'),
				route: {}
			} as any;

			await wrappedHandler(mockEvent);

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					context: 'unknown'
				}),
				'Unexpected error'
			);
		});
	});

	describe('errorToResponse', () => {
		it('converts ValiError to 400 validation error response', () => {
			// Create a simple schema that will fail
			const TestSchema = v.object({
				name: v.string()
			});

			let valiError: ValiError<typeof TestSchema> | null = null;

			try {
				v.parse(TestSchema, { name: 123 });
			} catch (error) {
				if (error instanceof ValiError) {
					valiError = error;
				}
			}

			expect(valiError).not.toBeNull();

			const response = errorToResponse(valiError!);

			expect(response.status).toBe(400);
		});

		it('converts AppError to response with custom status code', () => {
			const error = new NotFoundError('Resource not found');
			const response = errorToResponse(error);

			expect(response.status).toBe(404);
		});

		it('includes cause in AppError response', () => {
			const cause = new Error('Root cause');
			const error = new FileSystemError('Failed to read file', cause);
			const response = errorToResponse(error);

			expect(response.status).toBe(500);
		});

		it('converts standard Error to 500 response in production', () => {
			process.env.NODE_ENV = 'production';
			const error = new Error('Internal error');
			const response = errorToResponse(error);

			expect(response.status).toBe(500);
		});

		it('exposes error details in development mode', () => {
			process.env.NODE_ENV = 'development';
			const error = new Error('Debug error');
			const response = errorToResponse(error);

			expect(response.status).toBe(500);
		});

		it('hides error details in production mode', () => {
			process.env.NODE_ENV = 'production';
			const error = new Error('Secret internal error');
			const response = errorToResponse(error);

			expect(response.status).toBe(500);
		});

		it('handles unknown error types', () => {
			const response = errorToResponse({ weird: 'object' });

			expect(response.status).toBe(500);
		});

		it('handles null error', () => {
			const response = errorToResponse(null);

			expect(response.status).toBe(500);
		});
	});

	describe('logError', () => {
		it('logs operational AppError as warning', () => {
			const error = new ValidationError('Invalid data');
			logError(error, '/api/test');

			expect(loggers.error.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					context: '/api/test',
					statusCode: 400,
					message: 'Invalid data'
				}),
				'Operational error'
			);
		});

		it('logs non-operational AppError as error', () => {
			const error = new AppError('Critical error', 500, false);
			logError(error);

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 500,
					message: 'Critical error'
				}),
				'Programming error'
			);
		});

		it('logs standard Error', () => {
			const error = new Error('Unexpected error');
			logError(error, '/test');

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					context: '/test',
					message: 'Unexpected error',
					name: 'Error'
				}),
				'Unexpected error'
			);
		});

		it('logs unknown error types', () => {
			logError('string error', '/api/unknown');

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					context: '/api/unknown',
					error: 'string error'
				}),
				'Unknown error'
			);
		});

		it('logs error without context', () => {
			const error = new Error('No context error');
			logError(error);

			expect(loggers.error.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'No context error'
				}),
				'Unexpected error'
			);
		});

		it('includes error stack in AppError logging', () => {
			const error = new ConversionError('Conversion failed');
			logError(error);

			expect(loggers.error.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Conversion failed'
				}),
				'Operational error'
			);
		});

		it('includes cause in AppError logging', () => {
			const cause = new Error('Root cause');
			const error = new TileError('Tile operation failed', cause);
			logError(error);

			expect(loggers.error.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					cause
				}),
				'Operational error'
			);
		});
	});
});

describe('Error Classes', () => {
	describe('AppError', () => {
		class TestAppError extends AppError {
			constructor(message: string) {
				super(message, 418);
			}
		}

		it('creates error with message and status code', () => {
			const error = new TestAppError('Test error');

			expect(error.message).toBe('Test error');
			expect(error.statusCode).toBe(418);
			expect(error.isOperational).toBe(true);
			expect(error.name).toBe('TestAppError');
		});

		it('supports error cause chain', () => {
			const rootCause = new Error('Root cause');
			const error = new TestAppError('Wrapped error');
			error.cause = rootCause;

			expect(error.cause).toBe(rootCause);
		});

		it('defaults to 500 status code', () => {
			class DefaultError extends AppError {
				constructor(message: string) {
					super(message);
				}
			}
			const error = new DefaultError('Default status');

			expect(error.statusCode).toBe(500);
		});

		it('supports non-operational errors', () => {
			const error = new AppError('Programming error', 500, false);

			expect(error.isOperational).toBe(false);
		});

		it('captures stack trace', () => {
			const error = new TestAppError('Stack test');

			expect(error.stack).toBeDefined();
			expect(error.stack).toContain('TestAppError');
		});
	});

	describe('ValidationError', () => {
		it('creates 400 status error', () => {
			const error = new ValidationError('Invalid input');

			expect(error.statusCode).toBe(400);
			expect(error.message).toBe('Invalid input');
			expect(error.isOperational).toBe(true);
		});
	});

	describe('NotFoundError', () => {
		it('creates 404 status error with resource message', () => {
			const error = new NotFoundError('Resource not found');

			expect(error.statusCode).toBe(404);
			expect(error.message).toBe('Resource not found');
		});
	});

	describe('PathTraversalError', () => {
		it('creates 403 status error for path traversal attempts', () => {
			const error = new PathTraversalError('../etc/passwd');

			expect(error.statusCode).toBe(403);
			expect(error.message).toContain('directory traversal');
			expect(error.message).toContain('../etc/passwd');
		});
	});

	describe('FileSystemError', () => {
		it('creates error with filesystem operation context', () => {
			const error = new FileSystemError('Failed to read file');

			expect(error.statusCode).toBe(500);
			expect(error.message).toBe('Failed to read file');
		});

		it('supports cause parameter', () => {
			const cause = new Error('ENOENT');
			const error = new FileSystemError('File not found', cause);

			expect(error.cause).toBe(cause);
		});
	});

	describe('ProcessError', () => {
		it('captures exit code and stderr from failed processes', () => {
			const error = new ProcessError('tippecanoe', 1, null, 'Error output');

			expect(error.statusCode).toBe(500);
			expect(error.exitCode).toBe(1);
			expect(error.signal).toBeNull();
			expect(error.stderr).toBe('Error output');
			expect(error.message).toContain('tippecanoe');
			expect(error.message).toContain('exit code 1');
			expect(error.message).toContain('Error output');
		});

		it('includes signal in error message', () => {
			const error = new ProcessError('converter', null, 'SIGTERM', '');

			expect(error.signal).toBe('SIGTERM');
			expect(error.message).toContain('SIGTERM');
		});

		it('handles empty stderr', () => {
			const error = new ProcessError('test-process', 127);

			expect(error.stderr).toBe('');
			expect(error.message).not.toContain('\n');
		});
	});

	describe('ConversionError', () => {
		it('creates error with conversion context', () => {
			const error = new ConversionError('Conversion failed');

			expect(error.statusCode).toBe(500);
			expect(error.message).toBe('Conversion failed');
		});

		it('supports cause parameter', () => {
			const cause = new Error('Invalid format');
			const error = new ConversionError('Cannot convert', cause);

			expect(error.cause).toBe(cause);
		});
	});

	describe('TileError', () => {
		it('creates error with tile operation context', () => {
			const error = new TileError('Tile generation failed');

			expect(error.statusCode).toBe(500);
			expect(error.message).toBe('Tile generation failed');
		});

		it('supports cause parameter', () => {
			const cause = new Error('Invalid tile data');
			const error = new TileError('Tile error', cause);

			expect(error.cause).toBe(cause);
		});
	});
});
