import { AppError } from './errors.js';
import { ValiError } from 'valibot';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { loggers } from '../logger/index.js';

/**
 * Success response with optional status code
 */
export function successResponse<T>(data: T, status = 200) {
	return json(data, { status });
}

/**
 * Error response with appropriate status code
 */
export function errorResponse(error: unknown, status = 500) {
	const message = error instanceof Error ? error.message : String(error);
	return json({ error: message }, { status });
}

/**
 * Wraps a SvelteKit request handler with error handling
 */
export function withErrorHandling<T extends RequestHandler>(handler: T): T {
	return (async (event) => {
		try {
			return await handler(event);
		} catch (error) {
			logError(error, event.route.id || 'unknown');
			return errorToResponse(error);
		}
	}) as T;
}

/**
 * Convert any error to a standardized JSON response
 */
export function errorToResponse(error: unknown): Response {
	// Handle Valibot validation errors
	if (error instanceof ValiError) {
		return json(
			{
				error: 'Validation failed',
				details: error.issues.map((issue) => ({
					path: issue.path?.map((p: { key: string }) => p.key).join('.'),
					message: issue.message
				}))
			},
			{ status: 400 }
		);
	}

	// Handle custom application errors
	if (error instanceof AppError) {
		const response: { error: string; cause?: string } = {
			error: error.message
		};
		if (error.cause) {
			response.cause = String(error.cause);
		}
		return json(response, { status: error.statusCode });
	}

	// Handle standard errors
	if (error instanceof Error) {
		// Don't expose internal error details in production
		const isDevelopment = process.env.NODE_ENV !== 'production';
		return json(
			{
				error: isDevelopment ? error.message : 'Internal server error',
				...(isDevelopment && error.stack && { stack: error.stack })
			},
			{ status: 500 }
		);
	}

	// Handle unknown errors
	return json(
		{
			error: 'An unexpected error occurred'
		},
		{ status: 500 }
	);
}

/**
 * Log error with appropriate level based on error type
 */
export function logError(error: unknown, context?: string): void {
	const logContext = context ? { context } : {};

	if (error instanceof AppError) {
		if (error.isOperational) {
			loggers.error.warn(
				{
					...logContext,
					statusCode: error.statusCode,
					message: error.message,
					cause: error.cause
				},
				'Operational error'
			);
		} else {
			loggers.error.error(
				{
					...logContext,
					statusCode: error.statusCode,
					message: error.message,
					stack: error.stack,
					cause: error.cause
				},
				'Programming error'
			);
		}
	} else if (error instanceof Error) {
		loggers.error.error(
			{
				...logContext,
				message: error.message,
				stack: error.stack,
				name: error.name
			},
			'Unexpected error'
		);
	} else {
		loggers.error.error(
			{
				...logContext,
				error: String(error)
			},
			'Unknown error'
		);
	}
}
