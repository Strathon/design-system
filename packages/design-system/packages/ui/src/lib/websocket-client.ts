/**
 * Production WebSocket Client for Strathon Pulse Real-time Updates
 * Integrates with Trust Orchestrator V2 event stream
 * Maintains <500ms latency target with automatic reconnection
 */

import { QueryClient } from '@tanstack/react-query';

// WebSocket message types from Trust Orchestrator V2
export interface WebSocketMessage {
  type: 'metrics_update' | 'security_alert' | 'service_status' | 'circuit_breaker_state' | 'heartbeat';
  timestamp: string;
  requestId: string;
  data: any;
  version: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  messageTimeout: number;
  enableMetrics: boolean;
}

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

// WebSocket metrics for performance monitoring
export interface WebSocketMetrics {
  connectionTime: number;
  messagesReceived: number;
  messagesSent: number;
  reconnectCount: number;
  averageLatency: number;
  lastMessageTime: number;
  uptime: number;
}

// Event handlers
export interface WebSocketEventHandlers {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

class StrathonWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];
  private metrics: WebSocketMetrics;
  private eventHandlers: WebSocketEventHandlers = {};
  private queryClient: QueryClient | null = null;
  private connectionStartTime = 0;
  private latencyMeasurements: number[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_STRATHON_WS_URL || 'wss://api.strathon.com/v1/pulse/realtime',
      protocols: ['strathon-pulse-v1'],
      reconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000, // 30 seconds
      messageTimeout: 5000, // 5 seconds
      enableMetrics: true,
      ...config,
    };

    this.metrics = {
      connectionTime: 0,
      messagesReceived: 0,
      messagesSent: 0,
      reconnectCount: 0,
      averageLatency: 0,
      lastMessageTime: 0,
      uptime: 0,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(queryClient?: QueryClient): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.state === 'connected') {
        resolve();
        return;
      }

      this.queryClient = queryClient || null;
      this.state = 'connecting';
      this.connectionStartTime = Date.now();

      try {
        // Add authentication token to WebSocket URL
        const wsUrl = this.buildWebSocketURL();
        this.ws = new WebSocket(wsUrl, this.config.protocols);

        this.ws.onopen = () => {
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.metrics.connectionTime = Date.now() - this.connectionStartTime;
          
          console.log('Strathon WebSocket connected');
          this.eventHandlers.onConnect?.();
          this.startHeartbeat();
          this.processMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event.type}`);
          console.error('Strathon WebSocket error:', error);
          this.eventHandlers.onError?.(error);
          
          if (this.state === 'connecting') {
            reject(error);
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.state === 'connecting') {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        this.state = 'failed';
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.state = 'disconnected';
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: any): boolean {
    if (this.state !== 'connected' || !this.ws) {
      // Queue message for later if not connected
      this.messageQueue.push(message);
      return false;
    }

    try {
      const messageWithId = {
        ...message,
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
      };

      this.ws.send(JSON.stringify(messageWithId));
      this.metrics.messagesSent++;
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get connection metrics
   */
  getMetrics(): WebSocketMetrics {
    return {
      ...this.metrics,
      uptime: this.state === 'connected' ? Date.now() - this.connectionStartTime : 0,
      averageLatency: this.calculateAverageLatency(),
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods
  private buildWebSocketURL(): string {
    const url = new URL(this.config.url);
    
    // Add authentication token as query parameter
    const token = this.getAuthToken();
    if (token) {
      url.searchParams.set('token', token);
    }

    // Add client identification
    url.searchParams.set('client', 'strathon-pulse');
    url.searchParams.set('version', '1.0.0');

    return url.toString();
  }

  private handleMessage(event: MessageEvent): void {
    const receiveTime = Date.now();
    
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Validate message structure
      if (!this.isValidMessage(message)) {
        console.warn('Invalid WebSocket message received:', message);
        return;
      }

      // Calculate latency if timestamp is available
      if (message.timestamp) {
        const messageTime = new Date(message.timestamp).getTime();
        const latency = receiveTime - messageTime;
        this.recordLatency(latency);
      }

      this.metrics.messagesReceived++;
      this.metrics.lastMessageTime = receiveTime;

      // Handle different message types
      this.processMessage(message);

      // Call user-defined message handler
      this.eventHandlers.onMessage?.(message);

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private processMessage(message: WebSocketMessage): void {
    if (!this.queryClient) return;

    // Invalidate relevant React Query caches based on message type
    switch (message.type) {
      case 'metrics_update':
        this.queryClient.invalidateQueries({ queryKey: ['pulse', 'metrics'] });
        break;
      
      case 'security_alert':
        this.queryClient.invalidateQueries({ queryKey: ['pulse', 'violations'] });
        // Optionally update specific violation data
        if (message.data?.violationId) {
          this.queryClient.setQueryData(
            ['pulse', 'violations', message.data.violationId],
            message.data
          );
        }
        break;
      
      case 'service_status':
        this.queryClient.invalidateQueries({ queryKey: ['pulse', 'services'] });
        break;
      
      case 'circuit_breaker_state':
        this.queryClient.invalidateQueries({ queryKey: ['pulse', 'circuitBreakers'] });
        break;
      
      case 'heartbeat':
        // Respond to heartbeat to maintain connection
        this.send({ type: 'heartbeat_ack' });
        break;
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    
    this.state = 'disconnected';
    this.stopHeartbeat();
    this.eventHandlers.onDisconnect?.(event.reason);

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.config.reconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.state === 'reconnecting') return;

    this.state = 'reconnecting';
    this.reconnectAttempts++;
    this.metrics.reconnectCount++;

    const delay = this.config.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts - 1, 5));
    
    console.log(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.config.reconnectAttempts} in ${delay}ms`);
    this.eventHandlers.onReconnect?.(this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.queryClient).catch((error) => {
        console.error('WebSocket reconnection failed:', error);
        
        if (this.reconnectAttempts >= this.config.reconnectAttempts) {
          this.state = 'failed';
          console.error('WebSocket reconnection attempts exhausted');
        } else {
          this.attemptReconnect();
        }
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'heartbeat' });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private isValidMessage(message: any): boolean {
    return (
      typeof message === 'object' &&
      message !== null &&
      typeof message.type === 'string' &&
      typeof message.timestamp === 'string' &&
      typeof message.requestId === 'string'
    );
  }

  private recordLatency(latency: number): void {
    this.latencyMeasurements.push(latency);
    
    // Keep only last 100 measurements
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements = this.latencyMeasurements.slice(-100);
    }
  }

  private calculateAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) return 0;
    
    const sum = this.latencyMeasurements.reduce((acc, latency) => acc + latency, 0);
    return sum / this.latencyMeasurements.length;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('strathon_auth_token') || 
           process.env.NEXT_PUBLIC_STRATHON_API_TOKEN ||
           null;
  }

  private generateRequestId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for application use
export const wsClient = new StrathonWebSocketClient();

// Export for testing and custom configurations
export { StrathonWebSocketClient };
