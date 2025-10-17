import { z } from 'zod';

/**
 * Google API Error Details
 * Provides additional structured details about an error
 */
export const ErrorDetailSchema = z.object({
  '@type': z.string(),
  // Additional fields vary by error type
}).passthrough();

/**
 * Google API Error Response Schema
 * Follows the standard Google API error format
 * @see https://cloud.google.com/apis/design/errors
 */
export const GoogleApiErrorSchema = z.object({
  error: z.object({
    code: z.number(), // HTTP status code
    message: z.string(), // Human-readable error message
    status: z.string(), // gRPC status code (e.g., "INVALID_ARGUMENT", "NOT_FOUND")
    details: z.array(ErrorDetailSchema).optional(),
  }),
});

export type GoogleApiError = z.infer<typeof GoogleApiErrorSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
