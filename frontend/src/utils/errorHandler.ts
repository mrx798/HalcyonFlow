import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from an API error response.
 * Handles Axios errors, structured API responses, and generic fallback errors.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Check if the API returned a structured error response
    const apiError = error.response?.data;
    if (apiError && typeof apiError === 'object') {
      if ('message' in apiError && typeof apiError.message === 'string') {
        return apiError.message;
      }
    }

    // Standard HTTP status-based fallbacks
    switch (error.response?.status) {
      case 401: return 'Unauthorized. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 500: return 'Internal server error. Please try again later.';
      default: return error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred.';
};
