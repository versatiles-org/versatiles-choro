import * as v from 'valibot';
import { ConvertPolygonsRequest } from './requests';

/**
 * Schema for endpoints that don't require request parameters
 */
const EmptyRequest = v.object({});

/**
 * Type-safe API route definitions
 * Maps API URLs to their request schemas for compile-time type checking
 */
export const API_ROUTES = {
	'/api/convert/polygons': ConvertPolygonsRequest,
	'/api/download/test-data': EmptyRequest
} as const;

/**
 * Valid API route URLs
 */
export type ApiRoute = keyof typeof API_ROUTES;

/**
 * Get the request type for a specific API route
 */
export type ApiRequestType<T extends ApiRoute> = v.InferOutput<(typeof API_ROUTES)[T]>;
