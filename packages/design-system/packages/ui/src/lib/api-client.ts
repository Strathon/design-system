/**
 * Production API Client for Strathon Pulse
 * Integrates with Trust Orchestrator V2 backend
 * Follows Context Engineering methodology for performance optimization
 */

import { QueryClient } from '@tanstack/react-query';

// API Configuration
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableMetrics: boolean;
  enableTracing: boolean;
}

// Default configuration following Context Engineering principles
const defaultConfig: APIConfig = {
  baseURL: process.env.NEXT_PUBLIC_STRATHON_API_URL || 'https://api.strathon.com',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay with exponential backoff
  enableMetrics: true,
  enableTracing: true,
};

// API Response wrapper for consistent error handling
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  requestId: string;
  version: string;
}

// Error types for comprehensive error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public requestId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Request interceptor for authentication and tracing
interface RequestOptions extends RequestInit {
  timeout?: number;
  retryAttempts?: number;
  enableMetrics?: boolean;
  enableTracing?: boolean;
}

// Performance metrics collection
interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  retryCount: number;
  requestId: string;
}

class StrathonAPIClient {
  private config: APIConfig;
  private metrics: RequestMetrics[] = [];
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<APIConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Make authenticated API request with comprehensive error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    
    const {
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      enableMetrics = this.config.enableMetrics,
      enableTracing = this.config.enableTracing,
      ...fetchOptions
    } = options;

    // Setup abort controller for timeout handling
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    // Setup timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      const url = `${this.config.baseURL}${endpoint}`;
      
      // Prepare headers with authentication and tracing
      const headers = new Headers(fetchOptions.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('X-Request-ID', requestId);
      
      // Add authentication token if available
      const token = this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add tracing headers if enabled
      if (enableTracing) {
        headers.set('X-Trace-ID', this.generateTraceId());
        headers.set('X-Client-Version', '1.0.0');
        headers.set('X-Client-Name', 'strathon-pulse');
      }

      let lastError: Error;
      let retryCount = 0;

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: abortController.signal,
          });

          const endTime = performance.now();
          const duration = endTime - startTime;

          // Collect metrics
          if (enableMetrics) {
            this.collectMetrics({
              url,
              method: fetchOptions.method || 'GET',
              startTime,
              endTime,
              duration,
              status: response.status,
              success: response.ok,
              retryCount,
              requestId,
            });
          }

          if (!response.ok) {
            const errorData = await this.parseErrorResponse(response);
            throw new APIError(
              errorData.message || `HTTP ${response.status}`,
              response.status,
              errorData.code || 'HTTP_ERROR',
              requestId,
              errorData.details
            );
          }

          const data = await response.json();
          
          // Validate response structure
          if (!this.isValidAPIResponse(data)) {
            throw new APIError(
              'Invalid API response format',
              500,
              'INVALID_RESPONSE',
              requestId
            );
          }

          return data as APIResponse<T>;

        } catch (error) {
          lastError = error as Error;
          retryCount = attempt;

          // Don't retry on certain errors
          if (
            error instanceof APIError && 
            (error.status === 401 || error.status === 403 || error.status === 404)
          ) {
            break;
          }

          // Don't retry on abort (timeout)
          if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
          }

          // Wait before retry with exponential backoff
          if (attempt < retryAttempts) {
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
          }
        }
      }

      // If we get here, all retries failed
      if (lastError instanceof APIError) {
        throw lastError;
      } else {
        throw new NetworkError(
          `Network request failed after ${retryAttempts + 1} attempts`,
          lastError
        );
      }

    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request helper
   */
  async put<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request helper
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / this.metrics.length;
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successful = this.metrics.filter(metric => metric.success).length;
    return (successful / this.metrics.length) * 100;
  }

  // Private helper methods
  private getAuthToken(): string | null {
    // In production, this would get the token from secure storage
    return localStorage.getItem('strathon_auth_token') || 
           process.env.NEXT_PUBLIC_STRATHON_API_TOKEN ||
           null;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return {
        message: response.statusText || 'Unknown error',
        code: 'PARSE_ERROR',
      };
    }
  }

  private isValidAPIResponse(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.success === 'boolean' &&
      typeof data.timestamp === 'string' &&
      typeof data.requestId === 'string'
    );
  }

  private collectMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for application use
export const apiClient = new StrathonAPIClient();

// Export for testing and custom configurations
export { StrathonAPIClient };
