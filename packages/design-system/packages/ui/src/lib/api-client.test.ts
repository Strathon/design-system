import { StrathonAPIClient, APIError, NetworkError, TimeoutError } from './api-client';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

describe('StrathonAPIClient', () => {
  let client: StrathonAPIClient;

  beforeEach(() => {
    client = new StrathonAPIClient({
      baseURL: 'https://test-api.strathon.com',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    });
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    client.cancelAllRequests();
  });

  describe('Successful requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        data: { test: 'data' },
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        version: '1.0.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.strathon.com/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make successful POST request with data', async () => {
      const requestData = { name: 'test', value: 123 };
      const mockResponse = {
        data: { id: 1, ...requestData },
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        version: '1.0.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await client.post('/test-endpoint', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.strathon.com/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.any(Headers),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include authentication token when available', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-auth-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {},
          success: true,
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'test-request-id',
          version: '1.0.0',
        }),
      } as Response);

      await client.get('/test-endpoint');

      const [, options] = mockFetch.mock.calls[0];
      const headers = new Headers(options?.headers);
      expect(headers.get('Authorization')).toBe('Bearer test-auth-token');
    });
  });

  describe('Error handling', () => {
    it('should throw APIError for HTTP errors', async () => {
      const errorResponse = {
        message: 'Not found',
        code: 'NOT_FOUND',
        details: { resource: 'test' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(client.get('/test-endpoint')).rejects.toThrow(APIError);
      
      try {
        await client.get('/test-endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).status).toBe(404);
        expect((error as APIError).code).toBe('NOT_FOUND');
        expect((error as APIError).message).toBe('Not found');
      }
    });

    it('should throw TimeoutError for request timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({}),
          } as Response), 10000); // 10 seconds
        })
      );

      const promise = client.get('/test-endpoint');
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(5000);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });

    it('should retry on network errors', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: { test: 'data' },
            success: true,
            timestamp: '2024-01-01T00:00:00Z',
            requestId: 'test-request-id',
            version: '1.0.0',
          }),
        } as Response);

      const result = await client.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.data).toEqual({ test: 'data' });
    });

    it('should not retry on 401/403/404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        }),
      } as Response);

      await expect(client.get('/test-endpoint')).rejects.toThrow(APIError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('Request cancellation', () => {
    it('should cancel all pending requests', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({}),
          } as Response), 1000);
        })
      );

      const promise1 = client.get('/test-endpoint-1');
      const promise2 = client.get('/test-endpoint-2');

      client.cancelAllRequests();

      await expect(promise1).rejects.toThrow();
      await expect(promise2).rejects.toThrow();
    });
  });

  describe('Metrics collection', () => {
    it('should collect request metrics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {},
          success: true,
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'test-request-id',
          version: '1.0.0',
        }),
      } as Response);

      await client.get('/test-endpoint');

      const metrics = client.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        url: 'https://test-api.strathon.com/test-endpoint',
        method: 'GET',
        status: 200,
        success: true,
        retryCount: 0,
      });
    });

    it('should calculate average response time', async () => {
      const mockPerformanceNow = performance.now as jest.MockedFunction<typeof performance.now>;
      mockPerformanceNow
        .mockReturnValueOnce(0)    // Start time
        .mockReturnValueOnce(100)  // End time (100ms duration)
        .mockReturnValueOnce(200)  // Start time
        .mockReturnValueOnce(400); // End time (200ms duration)

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {},
          success: true,
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'test-request-id',
          version: '1.0.0',
        }),
      } as Response);

      await client.get('/test-endpoint-1');
      await client.get('/test-endpoint-2');

      const averageTime = client.getAverageResponseTime();
      expect(averageTime).toBe(150); // (100 + 200) / 2
    });

    it('should calculate success rate', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: {},
            success: true,
            timestamp: '2024-01-01T00:00:00Z',
            requestId: 'test-request-id',
            version: '1.0.0',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            message: 'Server error',
            code: 'SERVER_ERROR',
          }),
        } as Response);

      await client.get('/test-endpoint-1');
      
      try {
        await client.get('/test-endpoint-2');
      } catch {
        // Expected error
      }

      const successRate = client.getSuccessRate();
      expect(successRate).toBe(50); // 1 success out of 2 requests
    });
  });

  describe('Helper methods', () => {
    it('should support PUT requests', async () => {
      const requestData = { name: 'updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: requestData,
          success: true,
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'test-request-id',
          version: '1.0.0',
        }),
      } as Response);

      await client.put('/test-endpoint', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.strathon.com/test-endpoint',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should support DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({
          data: null,
          success: true,
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'test-request-id',
          version: '1.0.0',
        }),
      } as Response);

      await client.delete('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.strathon.com/test-endpoint',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
