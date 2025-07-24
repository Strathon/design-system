# Strathon Pulse API Integration Guide

This guide covers the production API integration for Strathon Pulse MVP, including configuration, authentication, and real-time WebSocket connections.

## Environment Configuration

### Required Environment Variables

```bash
# Production API Configuration
NEXT_PUBLIC_STRATHON_API_URL=https://api.strathon.com
NEXT_PUBLIC_STRATHON_WS_URL=wss://api.strathon.com/v1/pulse/realtime
NEXT_PUBLIC_STRATHON_API_TOKEN=your_api_token_here

# Optional Configuration
NEXT_PUBLIC_ENABLE_REALTIME=true
NODE_ENV=production
```

### Development Environment

```bash
# Development with Mock Data
NODE_ENV=development
# Leave NEXT_PUBLIC_STRATHON_API_URL undefined to use mock data

# Development with Real API
NODE_ENV=development
NEXT_PUBLIC_STRATHON_API_URL=https://staging-api.strathon.com
NEXT_PUBLIC_STRATHON_WS_URL=wss://staging-api.strathon.com/v1/pulse/realtime
NEXT_PUBLIC_STRATHON_API_TOKEN=your_staging_token_here
```

## API Client Usage

### Basic Usage

```typescript
import { apiClient, usePulseMetrics } from '@strathon/ui';

// Using React hooks (recommended)
function Dashboard() {
  const { data: metrics, isLoading, error } = usePulseMetrics(30000);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Active Threats: {metrics?.activeThreats}</div>;
}

// Direct API client usage
async function fetchMetrics() {
  try {
    const response = await apiClient.get('/v1/pulse/metrics/overview');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    throw error;
  }
}
```

### Authentication

The API client automatically handles authentication using tokens from:

1. `localStorage.getItem('strathon_auth_token')` (runtime)
2. `process.env.NEXT_PUBLIC_STRATHON_API_TOKEN` (build-time)

```typescript
// Set authentication token at runtime
localStorage.setItem('strathon_auth_token', 'your_token_here');

// Token is automatically included in all requests
const response = await apiClient.get('/v1/pulse/metrics/overview');
```

### Error Handling

```typescript
import { APIError, NetworkError, TimeoutError } from '@strathon/ui';

try {
  const response = await apiClient.get('/v1/pulse/metrics/overview');
  return response.data;
} catch (error) {
  if (error instanceof APIError) {
    // HTTP errors (4xx, 5xx)
    console.error(`API Error ${error.status}: ${error.message}`);
    console.error('Error code:', error.code);
    console.error('Request ID:', error.requestId);
  } else if (error instanceof NetworkError) {
    // Network connectivity issues
    console.error('Network error:', error.message);
  } else if (error instanceof TimeoutError) {
    // Request timeout
    console.error(`Request timeout after ${error.timeout}ms`);
  }
}
```

## WebSocket Real-time Updates

### Basic Usage

```typescript
import { useRealtimeUpdates } from '@strathon/ui';

function Dashboard() {
  const { 
    isConnected, 
    lastMessage, 
    connectionMetrics,
    disconnect,
    reconnect 
  } = useRealtimeUpdates((message) => {
    console.log('Real-time update:', message);
  });

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Latency: {connectionMetrics?.averageLatency}ms</div>
      {lastMessage && (
        <div>Last update: {lastMessage.type} at {lastMessage.timestamp}</div>
      )}
    </div>
  );
}
```

### Manual WebSocket Control

```typescript
import { wsClient } from '@strathon/ui';

// Connect manually
await wsClient.connect(queryClient);

// Set event handlers
wsClient.setEventHandlers({
  onConnect: () => console.log('Connected'),
  onDisconnect: (reason) => console.log('Disconnected:', reason),
  onMessage: (message) => console.log('Message:', message),
  onError: (error) => console.error('Error:', error),
  onReconnect: (attempt) => console.log(`Reconnecting (${attempt})`),
});

// Send messages
wsClient.send({ type: 'subscribe', data: { channel: 'metrics' } });

// Get connection metrics
const metrics = wsClient.getMetrics();
console.log('Average latency:', metrics.averageLatency);
console.log('Messages received:', metrics.messagesReceived);

// Disconnect
wsClient.disconnect();
```

## API Endpoints

### Trust Orchestrator V2 Endpoints

| Endpoint | Method | Description | Hook |
|----------|--------|-------------|------|
| `/v1/pulse/metrics/overview` | GET | Current KPI metrics | `usePulseMetrics()` |
| `/v1/pulse/security/violations` | GET | Security violations list | `useSecurityViolations()` |
| `/v1/pulse/metrics/timeseries` | GET | Time-series data | `useTimeSeriesData()` |
| `/v1/pulse/performance/services` | GET | Service health status | `useServiceHealth()` |
| `/v1/pulse/performance/circuit-breakers` | GET | Circuit breaker states | `useCircuitBreakers()` |

### Query Parameters

```typescript
// Security violations with filters
const { data } = useSecurityViolations({
  severity: 'high',
  status: 'new',
  limit: 50,
  offset: 0,
  timeRange: '24h'
});

// Time-series data
const { data } = useTimeSeriesData('requests', '7d');
```

## Performance Optimization

### Request Caching

React Query automatically caches API responses with configurable stale times:

```typescript
// Metrics refresh every 30 seconds
const { data } = usePulseMetrics(30000);

// Violations cached for 1 minute
const { data } = useSecurityViolations();

// Time-series cached for 30 seconds
const { data } = useTimeSeriesData('requests', '24h');
```

### WebSocket Performance

- **Target Latency**: <500ms for real-time updates
- **Automatic Reconnection**: Exponential backoff with max 10 attempts
- **Heartbeat**: 30-second intervals to maintain connection
- **Message Queuing**: Messages queued during disconnection

### Metrics Collection

```typescript
import { apiClient, wsClient } from '@strathon/ui';

// API client metrics
const apiMetrics = apiClient.getMetrics();
console.log('Average response time:', apiClient.getAverageResponseTime());
console.log('Success rate:', apiClient.getSuccessRate());

// WebSocket metrics
const wsMetrics = wsClient.getMetrics();
console.log('Connection uptime:', wsMetrics.uptime);
console.log('Average latency:', wsMetrics.averageLatency);
```

## Testing

### Mock Data Mode

Set `NODE_ENV=development` without API URL to use mock data:

```typescript
// Automatically uses mock data in development
const { data } = usePulseMetrics();
```

### API Client Testing

```typescript
import { StrathonAPIClient } from '@strathon/ui';

// Create test client
const testClient = new StrathonAPIClient({
  baseURL: 'https://test-api.strathon.com',
  timeout: 5000,
  retryAttempts: 1,
});

// Test with mock responses
const response = await testClient.get('/test-endpoint');
```

### WebSocket Testing

```typescript
import { StrathonWebSocketClient } from '@strathon/ui';

// Create test WebSocket client
const testWsClient = new StrathonWebSocketClient({
  url: 'wss://test-api.strathon.com/realtime',
  reconnectAttempts: 1,
});

// Test connection
await testWsClient.connect();
```

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   - Check `NEXT_PUBLIC_STRATHON_API_TOKEN` environment variable
   - Verify token is set in localStorage: `localStorage.getItem('strathon_auth_token')`

2. **Connection Timeouts**
   - Check network connectivity
   - Verify API URL is correct
   - Check firewall/proxy settings

3. **WebSocket Connection Failures**
   - Verify WebSocket URL (wss://)
   - Check for proxy/firewall blocking WebSocket connections
   - Ensure authentication token is valid

4. **CORS Issues**
   - Verify API server CORS configuration
   - Check request headers and origins

### Debug Mode

Enable debug logging:

```typescript
// Enable detailed logging
localStorage.setItem('strathon_debug', 'true');

// Check API client metrics
console.log('API Metrics:', apiClient.getMetrics());

// Check WebSocket metrics
console.log('WebSocket Metrics:', wsClient.getMetrics());
```

### Health Checks

```typescript
// Test API connectivity
try {
  const response = await apiClient.get('/v1/health');
  console.log('API Health:', response.data);
} catch (error) {
  console.error('API Health Check Failed:', error);
}

// Test WebSocket connectivity
const isConnected = wsClient.isConnected();
console.log('WebSocket Connected:', isConnected);
```

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Configure authentication tokens
3. Verify API endpoints are accessible
4. Test WebSocket connectivity

### Monitoring

- Monitor API response times (<500ms target)
- Track WebSocket connection stability
- Monitor error rates and retry attempts
- Set up alerts for connection failures

### Security

- Use HTTPS/WSS in production
- Rotate authentication tokens regularly
- Implement proper CORS policies
- Monitor for suspicious API usage patterns
