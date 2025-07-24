import { StrathonWebSocketClient, type WebSocketMessage } from './websocket-client';
import { QueryClient } from '@tanstack/react-query';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocols?: string | string[];
  
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Mock sending - in real tests, you might want to simulate responses
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate an error
  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('StrathonWebSocketClient', () => {
  let client: StrathonWebSocketClient;
  let queryClient: QueryClient;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    client = new StrathonWebSocketClient({
      url: 'wss://test-api.strathon.com/realtime',
      reconnectAttempts: 3,
      reconnectDelay: 100,
      heartbeatInterval: 1000,
    });
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockLocalStorage.getItem.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    client.disconnect();
  });

  describe('Connection management', () => {
    it('should connect successfully', async () => {
      const connectPromise = client.connect(queryClient);
      
      // Fast-forward to allow connection to complete
      jest.advanceTimersByTime(20);
      
      await connectPromise;
      
      expect(client.getState()).toBe('connected');
      expect(client.isConnected()).toBe(true);
    });

    it('should include authentication token in URL', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-auth-token');
      
      const connectPromise = client.connect(queryClient);
      jest.advanceTimersByTime(20);
      await connectPromise;

      // Check that the WebSocket was created with the correct URL
      expect(MockWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('token=test-auth-token'),
        expect.any(Array)
      );
    });

    it('should disconnect cleanly', async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);
      
      client.disconnect();
      
      expect(client.getState()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });

    it('should handle connection timeout', async () => {
      // Create a client that won't connect automatically
      const slowClient = new StrathonWebSocketClient({
        url: 'wss://slow-api.strathon.com/realtime',
      });

      // Mock WebSocket that never opens
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols);
          // Don't simulate connection - leave in CONNECTING state
          this.readyState = MockWebSocket.CONNECTING;
        }
      };

      const connectPromise = slowClient.connect(queryClient);
      
      // Fast-forward past connection timeout
      jest.advanceTimersByTime(15000);
      
      await expect(connectPromise).rejects.toThrow('WebSocket connection timeout');
    });
  });

  describe('Message handling', () => {
    beforeEach(async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);
    });

    it('should receive and process messages', () => {
      const mockMessage: WebSocketMessage = {
        type: 'metrics_update',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        data: { activeThreats: 5 },
        version: '1.0.0',
      };

      const messageHandler = jest.fn();
      client.setEventHandlers({ onMessage: messageHandler });

      // Simulate receiving a message
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(mockMessage);

      expect(messageHandler).toHaveBeenCalledWith(mockMessage);
    });

    it('should invalidate React Query cache on metrics update', () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      
      const mockMessage: WebSocketMessage = {
        type: 'metrics_update',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        data: { activeThreats: 5 },
        version: '1.0.0',
      };

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(mockMessage);

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['pulse', 'metrics']
      });
    });

    it('should handle invalid messages gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const ws = (client as any).ws as MockWebSocket;
      ws.onmessage?.(new MessageEvent('message', { 
        data: JSON.stringify({ invalid: 'message' }) 
      }));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid WebSocket message received:',
        expect.any(Object)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should respond to heartbeat messages', () => {
      const sendSpy = jest.spyOn(client, 'send');
      
      const heartbeatMessage: WebSocketMessage = {
        type: 'heartbeat',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'heartbeat-request-id',
        data: {},
        version: '1.0.0',
      };

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(heartbeatMessage);

      expect(sendSpy).toHaveBeenCalledWith({ type: 'heartbeat_ack' });
    });
  });

  describe('Message sending', () => {
    beforeEach(async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);
    });

    it('should send messages when connected', () => {
      const message = { type: 'test', data: 'test data' };
      const result = client.send(message);

      expect(result).toBe(true);
    });

    it('should queue messages when not connected', () => {
      client.disconnect();
      
      const message = { type: 'test', data: 'test data' };
      const result = client.send(message);

      expect(result).toBe(false);
      
      // Message should be queued and sent when reconnected
      const connectPromise = client.connect(queryClient);
      jest.advanceTimersByTime(20);
      
      // The queued message should be sent automatically
    });
  });

  describe('Reconnection logic', () => {
    it('should attempt reconnection on unexpected close', async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);

      const reconnectHandler = jest.fn();
      client.setEventHandlers({ onReconnect: reconnectHandler });

      // Simulate unexpected disconnection
      const ws = (client as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost'); // Abnormal closure

      expect(client.getState()).toBe('reconnecting');
      
      // Fast-forward to trigger reconnection attempt
      jest.advanceTimersByTime(200);
      
      expect(reconnectHandler).toHaveBeenCalledWith(1);
    });

    it('should not reconnect on clean close', async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);

      const reconnectHandler = jest.fn();
      client.setEventHandlers({ onReconnect: reconnectHandler });

      // Simulate clean disconnection
      const ws = (client as any).ws as MockWebSocket;
      ws.close(1000, 'Normal closure');

      expect(client.getState()).toBe('disconnected');
      
      // Fast-forward and ensure no reconnection attempt
      jest.advanceTimersByTime(1000);
      
      expect(reconnectHandler).not.toHaveBeenCalled();
    });

    it('should give up after max reconnection attempts', async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);

      // Mock WebSocket to always fail connection
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols);
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            this.onerror?.(new Event('error'));
          }, 10);
        }
      };

      // Simulate unexpected disconnection
      const ws = (client as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost');

      // Fast-forward through all reconnection attempts
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
      }

      expect(client.getState()).toBe('failed');
    });
  });

  describe('Metrics collection', () => {
    beforeEach(async () => {
      await client.connect(queryClient);
      jest.advanceTimersByTime(20);
    });

    it('should collect connection metrics', () => {
      const metrics = client.getMetrics();
      
      expect(metrics).toMatchObject({
        connectionTime: expect.any(Number),
        messagesReceived: 0,
        messagesSent: 0,
        reconnectCount: 0,
        averageLatency: 0,
        lastMessageTime: 0,
        uptime: expect.any(Number),
      });
    });

    it('should track sent and received messages', () => {
      // Send a message
      client.send({ type: 'test' });
      
      // Simulate receiving a message
      const mockMessage: WebSocketMessage = {
        type: 'metrics_update',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        data: {},
        version: '1.0.0',
      };
      
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(mockMessage);

      const metrics = client.getMetrics();
      expect(metrics.messagesSent).toBe(1);
      expect(metrics.messagesReceived).toBe(1);
    });

    it('should calculate latency from message timestamps', () => {
      const pastTime = new Date(Date.now() - 100).toISOString();
      const mockMessage: WebSocketMessage = {
        type: 'metrics_update',
        timestamp: pastTime,
        requestId: 'test-request-id',
        data: {},
        version: '1.0.0',
      };
      
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(mockMessage);

      const metrics = client.getMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('Event handlers', () => {
    it('should call event handlers at appropriate times', async () => {
      const handlers = {
        onConnect: jest.fn(),
        onDisconnect: jest.fn(),
        onMessage: jest.fn(),
        onError: jest.fn(),
        onReconnect: jest.fn(),
      };

      client.setEventHandlers(handlers);

      // Test connection
      const connectPromise = client.connect(queryClient);
      jest.advanceTimersByTime(20);
      await connectPromise;
      
      expect(handlers.onConnect).toHaveBeenCalled();

      // Test message
      const mockMessage: WebSocketMessage = {
        type: 'metrics_update',
        timestamp: '2024-01-01T00:00:00Z',
        requestId: 'test-request-id',
        data: {},
        version: '1.0.0',
      };
      
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage(mockMessage);
      
      expect(handlers.onMessage).toHaveBeenCalledWith(mockMessage);

      // Test disconnection
      client.disconnect();
      expect(handlers.onDisconnect).toHaveBeenCalled();
    });
  });
});
