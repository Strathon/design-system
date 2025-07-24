import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { apiClient, type APIResponse } from '../lib/api-client';
import { wsClient, type WebSocketMessage } from '../lib/websocket-client';

// Types for Pulse API data
export interface PulseMetrics {
  activeThreats: number;
  resilienceScore: number;
  p95Latency: number;
  cost24h: number;
  timestamp: string;
}

export interface SecurityViolation {
  id: string;
  timestamp: string;
  type: 'PROMPT_INJECTION' | 'PII_LEAK' | 'POLICY_VIOLATION' | 'ANOMALY_DETECTION';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'mitigated' | 'false_positive';
  source: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
  };
  details: {
    policyId?: string;
    ruleId?: string;
    confidence: number;
    description: string;
    recommendation: string;
  };
  traceId: string;
  affectedServices: string[];
  tags: string[];
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number;
  lastCheck: string;
}

export interface CircuitBreakerStatus {
  name: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  failureThreshold: number;
  timeout: number;
  lastFailure?: string;
  nextAttempt?: string;
  successCount: number;
  metrics: {
    requests: number;
    failures: number;
    successes: number;
    timeouts: number;
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

// Mock data generators for development
const generateMockMetrics = (): PulseMetrics => ({
  activeThreats: Math.floor(Math.random() * 20) + 5,
  resilienceScore: Math.floor(Math.random() * 10) + 90,
  p95Latency: Math.floor(Math.random() * 100) + 100,
  cost24h: Math.floor(Math.random() * 1000) + 2000,
  timestamp: new Date().toISOString(),
});

const generateMockViolations = (count: number = 10): SecurityViolation[] => {
  const types: SecurityViolation['type'][] = ['PROMPT_INJECTION', 'PII_LEAK', 'POLICY_VIOLATION', 'ANOMALY_DETECTION'];
  const severities: SecurityViolation['severity'][] = ['critical', 'high', 'medium', 'low'];
  const statuses: SecurityViolation['status'][] = ['new', 'investigating', 'mitigated', 'false_positive'];

  return Array.from({ length: count }, (_, i) => ({
    id: `violation-${i + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    source: {
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 1000)}` : undefined,
      sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
    },
    details: {
      policyId: `policy-${Math.floor(Math.random() * 10) + 1}`,
      ruleId: `rule-${Math.floor(Math.random() * 50) + 1}`,
      confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      description: 'Potential security violation detected in AI request',
      recommendation: 'Review request content and apply appropriate policy',
    },
    traceId: `trace-${Math.random().toString(36).substr(2, 16)}`,
    affectedServices: ['ai-gateway', 'policy-engine'],
    tags: ['security', 'ai-safety'],
  }));
};

const generateMockTimeSeries = (hours: number = 24): TimeSeriesData[] => {
  return Array.from({ length: hours }, (_, i) => ({
    timestamp: new Date(Date.now() - (hours - i) * 3600000).toISOString(),
    value: Math.floor(Math.random() * 100) + 50,
    label: `Hour ${i + 1}`,
  }));
};

const generateMockServiceHealth = (): ServiceHealth[] => [
  {
    serviceName: 'AI Gateway',
    status: 'healthy',
    uptime: 99.9,
    responseTime: { p50: 45, p95: 120, p99: 200 },
    errorRate: 0.1,
    throughput: 1250,
    lastCheck: new Date().toISOString(),
  },
  {
    serviceName: 'Policy Engine',
    status: 'healthy',
    uptime: 99.8,
    responseTime: { p50: 25, p95: 80, p99: 150 },
    errorRate: 0.2,
    throughput: 2100,
    lastCheck: new Date().toISOString(),
  },
  {
    serviceName: 'ML Pipeline',
    status: 'degraded',
    uptime: 98.5,
    responseTime: { p50: 180, p95: 450, p99: 800 },
    errorRate: 2.1,
    throughput: 450,
    lastCheck: new Date().toISOString(),
  },
];

const generateMockCircuitBreakers = (): CircuitBreakerStatus[] => [
  {
    name: 'openai-api',
    state: 'closed',
    failureCount: 2,
    failureThreshold: 5,
    timeout: 60000,
    successCount: 1247,
    metrics: {
      requests: 1249,
      failures: 2,
      successes: 1247,
      timeouts: 0,
    },
  },
  {
    name: 'policy-validator',
    state: 'half_open',
    failureCount: 3,
    failureThreshold: 5,
    timeout: 30000,
    lastFailure: new Date(Date.now() - 45000).toISOString(),
    nextAttempt: new Date(Date.now() + 15000).toISOString(),
    successCount: 892,
    metrics: {
      requests: 895,
      failures: 3,
      successes: 892,
      timeouts: 0,
    },
  },
];

// API client configuration
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_STRATHON_API_URL;
const ENABLE_REAL_TIME = process.env.NEXT_PUBLIC_ENABLE_REALTIME !== 'false';

// Query keys
export const pulseQueryKeys = {
  all: ['pulse'] as const,
  metrics: () => [...pulseQueryKeys.all, 'metrics'] as const,
  violations: (filters?: any) => [...pulseQueryKeys.all, 'violations', filters] as const,
  timeSeries: (metric: string, timeRange: string) => [...pulseQueryKeys.all, 'timeSeries', metric, timeRange] as const,
  services: () => [...pulseQueryKeys.all, 'services'] as const,
  circuitBreakers: () => [...pulseQueryKeys.all, 'circuitBreakers'] as const,
};

// Custom hooks for Pulse data with real API integration
export const usePulseMetrics = (refetchInterval: number = 30000) => {
  return useQuery({
    queryKey: pulseQueryKeys.metrics(),
    queryFn: async (): Promise<PulseMetrics> => {
      if (USE_MOCK_DATA) {
        // Simulate API delay for development
        await new Promise(resolve => setTimeout(resolve, 200));
        return generateMockMetrics();
      }

      try {
        const response = await apiClient.get<PulseMetrics>('/v1/pulse/metrics/overview');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch pulse metrics:', error);
        // Fallback to mock data on error for development
        if (process.env.NODE_ENV === 'development') {
          return generateMockMetrics();
        }
        throw error;
      }
    },
    refetchInterval: ENABLE_REAL_TIME ? refetchInterval : false,
    staleTime: 10000, // 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useSecurityViolations = (filters?: any) => {
  return useQuery({
    queryKey: pulseQueryKeys.violations(filters),
    queryFn: async (): Promise<SecurityViolation[]> => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return generateMockViolations(25);
      }

      try {
        const params = new URLSearchParams(filters);
        const endpoint = `/v1/pulse/security/violations${params.toString() ? `?${params}` : ''}`;
        const response = await apiClient.get<SecurityViolation[]>(endpoint);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch security violations:', error);
        if (process.env.NODE_ENV === 'development') {
          return generateMockViolations(25);
        }
        throw error;
      }
    },
    staleTime: 60000, // 1 minute
    retry: 2,
    retryDelay: 1000,
  });
};

export const useTimeSeriesData = (metric: string, timeRange: string = '24h') => {
  return useQuery({
    queryKey: pulseQueryKeys.timeSeries(metric, timeRange),
    queryFn: async (): Promise<TimeSeriesData[]> => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return generateMockTimeSeries(24);
      }

      try {
        const endpoint = `/v1/pulse/metrics/timeseries?metric=${encodeURIComponent(metric)}&timeRange=${encodeURIComponent(timeRange)}`;
        const response = await apiClient.get<TimeSeriesData[]>(endpoint);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch time series data:', error);
        if (process.env.NODE_ENV === 'development') {
          return generateMockTimeSeries(24);
        }
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: 1000,
  });
};

export const useServiceHealth = () => {
  return useQuery({
    queryKey: pulseQueryKeys.services(),
    queryFn: async (): Promise<ServiceHealth[]> => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 250));
        return generateMockServiceHealth();
      }

      try {
        const response = await apiClient.get<ServiceHealth[]>('/v1/pulse/performance/services');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch service health:', error);
        if (process.env.NODE_ENV === 'development') {
          return generateMockServiceHealth();
        }
        throw error;
      }
    },
    refetchInterval: ENABLE_REAL_TIME ? 15000 : false, // 15 seconds
    staleTime: 5000, // 5 seconds
    retry: 2,
    retryDelay: 1000,
  });
};

export const useCircuitBreakers = () => {
  return useQuery({
    queryKey: pulseQueryKeys.circuitBreakers(),
    queryFn: async (): Promise<CircuitBreakerStatus[]> => {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return generateMockCircuitBreakers();
      }

      try {
        const response = await apiClient.get<CircuitBreakerStatus[]>('/v1/pulse/performance/circuit-breakers');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch circuit breakers:', error);
        if (process.env.NODE_ENV === 'development') {
          return generateMockCircuitBreakers();
        }
        throw error;
      }
    },
    refetchInterval: ENABLE_REAL_TIME ? 10000 : false, // 10 seconds
    staleTime: 5000, // 5 seconds
    retry: 2,
    retryDelay: 1000,
  });
};

// WebSocket hook for real-time updates with production WebSocket client
export const useRealtimeUpdates = (onUpdate?: (data: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionMetrics, setConnectionMetrics] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (USE_MOCK_DATA || !ENABLE_REAL_TIME) {
      // Simulate real-time updates with mock data
      const interval = setInterval(() => {
        const mockUpdate: WebSocketMessage = {
          type: 'metrics_update',
          data: generateMockMetrics(),
          timestamp: new Date().toISOString(),
          requestId: `mock_${Date.now()}`,
          version: '1.0.0',
        };

        setLastMessage(mockUpdate);
        onUpdate?.(mockUpdate);

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: pulseQueryKeys.metrics() });
      }, 30000); // Every 30 seconds

      setIsConnected(true);
      return () => clearInterval(interval);
    }

    // Production WebSocket connection
    const connectWebSocket = async () => {
      try {
        // Set up event handlers
        wsClient.setEventHandlers({
          onConnect: () => {
            setIsConnected(true);
            console.log('Strathon Pulse WebSocket connected');
          },
          onDisconnect: (reason) => {
            setIsConnected(false);
            console.log('Strathon Pulse WebSocket disconnected:', reason);
          },
          onMessage: (message) => {
            setLastMessage(message);
            onUpdate?.(message);

            // Update connection metrics
            setConnectionMetrics(wsClient.getMetrics());
          },
          onError: (error) => {
            console.error('Strathon Pulse WebSocket error:', error);
            setIsConnected(false);
          },
          onReconnect: (attempt) => {
            console.log(`Strathon Pulse WebSocket reconnecting (attempt ${attempt})`);
          },
        });

        // Connect to WebSocket server
        await wsClient.connect(queryClient);

      } catch (error) {
        console.error('Failed to connect to Strathon Pulse WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, [onUpdate, queryClient]);

  // Update metrics periodically
  useEffect(() => {
    if (!isConnected || USE_MOCK_DATA) return;

    const metricsInterval = setInterval(() => {
      setConnectionMetrics(wsClient.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(metricsInterval);
  }, [isConnected]);

  return {
    isConnected,
    lastMessage,
    connectionMetrics,
    disconnect: () => {
      wsClient.disconnect();
      setIsConnected(false);
    },
    reconnect: () => {
      if (!isConnected && !USE_MOCK_DATA && ENABLE_REAL_TIME) {
        wsClient.connect(queryClient).catch(console.error);
      }
    },
    getMetrics: () => wsClient.getMetrics(),
  };
};
