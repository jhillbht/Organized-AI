/**
 * Custom error class for Organized AI Client errors
 */
export class ClientError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode?: number, details?: any) {
    super(message);
    this.name = 'ClientError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Set the prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, ClientError.prototype);
  }

  /**
   * Create an error from an API response
   */
  static fromResponse(response: any, fallbackMessage: string = 'An error occurred with the MCP server'): ClientError {
    const statusCode = response?.status;
    const data = response?.data;
    
    const message = data?.error?.message || data?.message || fallbackMessage;
    const code = data?.error?.code || data?.code || 'API_ERROR';
    
    return new ClientError(message, code, statusCode, data);
  }
  
  /**
   * Create a network error
   */
  static networkError(originalError: Error): ClientError {
    return new ClientError(
      `Network error: ${originalError.message}`,
      'NETWORK_ERROR',
      undefined,
      { originalError }
    );
  }
  
  /**
   * Create a timeout error
   */
  static timeoutError(timeout: number): ClientError {
    return new ClientError(
      `Request timed out after ${timeout}ms`,
      'TIMEOUT_ERROR'
    );
  }
}
