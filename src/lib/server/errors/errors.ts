/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

/**
 * Error thrown when a file or resource is not found
 */
export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message, 404);
	}
}

/**
 * Error thrown when a path traversal attempt is detected
 */
export class PathTraversalError extends AppError {
	constructor(path: string) {
		super(`Invalid path: attempted directory traversal (${path})`, 403);
	}
}

/**
 * Error thrown when a file operation fails
 */
export class FileSystemError extends AppError {
	constructor(message: string, cause?: Error) {
		super(message, 500);
		if (cause) {
			this.cause = cause;
		}
	}
}

/**
 * Error thrown when a child process fails
 */
export class ProcessError extends AppError {
	public readonly exitCode: number | null;
	public readonly signal: NodeJS.Signals | null;
	public readonly stderr: string;

	constructor(
		processName: string,
		exitCode: number | null,
		signal: NodeJS.Signals | null = null,
		stderr: string = ''
	) {
		const signalMsg = signal ? ` (signal: ${signal})` : '';
		const stderrMsg = stderr ? `\n${stderr}` : '';
		super(`${processName} failed with exit code ${exitCode}${signalMsg}${stderrMsg}`, 500);
		this.exitCode = exitCode;
		this.signal = signal;
		this.stderr = stderr;
	}
}

/**
 * Error thrown when conversion fails
 */
export class ConversionError extends AppError {
	constructor(message: string, cause?: Error) {
		super(message, 500);
		if (cause) {
			this.cause = cause;
		}
	}
}

/**
 * Error thrown when tile operations fail
 */
export class TileError extends AppError {
	constructor(message: string, cause?: Error) {
		super(message, 500);
		if (cause) {
			this.cause = cause;
		}
	}
}
