// Components
export { Button, buttonVariants } from './components/button/button';
export type { ButtonProps } from './components/button/button';

export { Badge, badgeVariants } from './components/badge/badge';
export type { BadgeProps } from './components/badge/badge';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from './components/card/card';

// Layout Components
export {
  Grid,
  GridItem,
  DashboardGrid,
  KPISection,
  KPIGrid,
  ChartSection,
  WidgetSection,
  gridVariants,
  gridItemVariants,
  useBreakpoint,
  breakpoints,
} from './components/layout/grid';
export type { GridProps, GridItemProps } from './components/layout/grid';

// Metrics Components
export { KPICard, kpiCardVariants } from './components/metrics/kpi-card';
export type { KPICardProps, TrendData, ChangeIndicator } from './components/metrics/kpi-card';

// Chart Components
export { LineChart } from './components/charts/line-chart';
export type { LineChartProps, ChartDataPoint, LineChartSeries } from './components/charts/line-chart';

// Dashboard Components
export {
  OverviewDashboard,
  ServiceHealthWidget,
  CircuitBreakerWidget,
  RecentAlertsWidget
} from './components/dashboard/overview-dashboard';
export type { OverviewDashboardProps } from './components/dashboard/overview-dashboard';

// Hooks
export {
  usePulseMetrics,
  useSecurityViolations,
  useTimeSeriesData,
  useServiceHealth,
  useCircuitBreakers,
  useRealtimeUpdates,
  pulseQueryKeys,
} from './hooks/use-pulse-data';
export type {
  PulseMetrics,
  SecurityViolation,
  ServiceHealth,
  CircuitBreakerStatus,
  TimeSeriesData,
} from './hooks/use-pulse-data';

// API Client and WebSocket
export { apiClient, StrathonAPIClient, APIError, NetworkError, TimeoutError } from './lib/api-client';
export type { APIConfig, APIResponse } from './lib/api-client';

export { wsClient, StrathonWebSocketClient } from './lib/websocket-client';
export type {
  WebSocketConfig,
  WebSocketMessage,
  WebSocketMetrics,
  WebSocketEventHandlers,
  ConnectionState
} from './lib/websocket-client';

// Utilities
export { cn } from './utils/cn';

// Re-export design tokens for convenience
export * from '@strathon/tokens';
