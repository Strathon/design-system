import * as React from 'react';
import { Shield, Activity, DollarSign, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  DashboardGrid, 
  KPISection, 
  KPIGrid, 
  ChartSection, 
  WidgetSection,
  GridItem 
} from '../layout/grid';
import { KPICard, type ChangeIndicator } from '../metrics/kpi-card';
import { LineChart, type LineChartSeries } from '../charts/line-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../card/card';
import { Badge } from '../badge/badge';
import { 
  usePulseMetrics, 
  useTimeSeriesData, 
  useServiceHealth, 
  useCircuitBreakers,
  useRealtimeUpdates 
} from '../../hooks/use-pulse-data';

export interface OverviewDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  refreshInterval?: number;
  onKPIClick?: (kpiId: string) => void;
  onChartDataPointClick?: (dataPoint: any) => void;
}

const formatChange = (current: number, previous: number, isPositive: boolean = true): ChangeIndicator => {
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
    period: 'vs yesterday',
    isPositive: change > 0 ? isPositive : !isPositive,
  };
};

const ServiceHealthWidget = () => {
  const { data: services, isLoading } = useServiceHealth();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="w-3 h-3 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Service Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services?.map((service) => (
            <div key={service.serviceName} className="flex justify-between items-center">
              <span className="text-sm font-medium">{service.serviceName}</span>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    service.status === 'healthy' 
                      ? 'success' 
                      : service.status === 'degraded' 
                      ? 'warning' 
                      : 'destructive'
                  }
                  size="sm"
                  className="capitalize"
                >
                  {service.status}
                </Badge>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    service.status === 'healthy' && 'bg-green-500',
                    service.status === 'degraded' && 'bg-yellow-500',
                    service.status === 'unhealthy' && 'bg-red-500'
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CircuitBreakerWidget = () => {
  const { data: circuitBreakers, isLoading } = useCircuitBreakers();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Circuit Breakers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Circuit Breakers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {circuitBreakers?.map((cb) => (
            <div key={cb.name} className="flex justify-between items-center">
              <span className="text-sm font-medium">{cb.name}</span>
              <Badge
                variant={
                  cb.state === 'closed' 
                    ? 'success' 
                    : cb.state === 'half_open' 
                    ? 'warning' 
                    : 'destructive'
                }
                size="sm"
                className="capitalize"
              >
                {cb.state.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const RecentAlertsWidget = () => {
  const alerts = [
    { id: '1', message: 'High latency detected in ML Pipeline', severity: 'warning', time: '2 min ago' },
    { id: '2', message: 'PII detection rule triggered', severity: 'error', time: '5 min ago' },
    { id: '3', message: 'Circuit breaker opened for OpenAI API', severity: 'warning', time: '12 min ago' },
    { id: '4', message: 'System health check passed', severity: 'success', time: '15 min ago' },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3">
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  alert.severity === 'success' && 'bg-green-500',
                  alert.severity === 'warning' && 'bg-yellow-500',
                  alert.severity === 'error' && 'bg-red-500'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const OverviewDashboard = React.forwardRef<HTMLDivElement, OverviewDashboardProps>(
  ({
    className,
    title = "Strathon Pulse - Overview",
    subtitle = "Real-time AI security monitoring and performance insights",
    refreshInterval = 30000,
    onKPIClick,
    onChartDataPointClick,
    ...props
  }, ref) => {
    const { data: metrics, isLoading: metricsLoading } = usePulseMetrics(refreshInterval);
    const { data: timeSeriesData, isLoading: chartLoading } = useTimeSeriesData('requests', '24h');
    const { isConnected } = useRealtimeUpdates();

    // Transform time series data for chart
    const chartData: LineChartSeries[] = React.useMemo(() => {
      if (!timeSeriesData) return [];
      
      return [
        {
          id: 'requests',
          name: 'Total Requests',
          data: timeSeriesData.map(point => ({
            timestamp: point.timestamp,
            value: point.value,
          })),
          color: '#E00010',
          fill: true,
        },
        {
          id: 'blocked',
          name: 'Blocked Requests',
          data: timeSeriesData.map(point => ({
            timestamp: point.timestamp,
            value: Math.floor(point.value * 0.1), // 10% blocked
          })),
          color: '#EF4444',
        },
        {
          id: 'allowed',
          name: 'Allowed Requests',
          data: timeSeriesData.map(point => ({
            timestamp: point.timestamp,
            value: Math.floor(point.value * 0.9), // 90% allowed
          })),
          color: '#10B981',
        },
      ];
    }, [timeSeriesData]);

    return (
      <DashboardGrid ref={ref} className={cn(className)} {...props}>
        {/* Header Section */}
        <KPISection>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-heading-1 font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* KPI Cards */}
          <KPIGrid>
            <GridItem>
              <KPICard
                title="Active Threats"
                value={metrics?.activeThreats || 0}
                status={metrics?.activeThreats && metrics.activeThreats > 10 ? 'error' : 'warning'}
                icon={AlertTriangle}
                change={formatChange(metrics?.activeThreats || 0, 8, false)}
                description="Security violations detected"
                loading={metricsLoading}
                onCardClick={() => onKPIClick?.('threats')}
              />
            </GridItem>
            <GridItem>
              <KPICard
                title="Resilience Score"
                value={metrics?.resilienceScore || 0}
                unit="%"
                status="success"
                icon={Shield}
                target={95}
                change={formatChange(metrics?.resilienceScore || 0, 96, true)}
                description="AI system reliability"
                loading={metricsLoading}
                onCardClick={() => onKPIClick?.('resilience')}
              />
            </GridItem>
            <GridItem>
              <KPICard
                title="P95 Latency"
                value={metrics?.p95Latency || 0}
                unit="ms"
                status={metrics?.p95Latency && metrics.p95Latency > 200 ? 'warning' : 'success'}
                icon={Activity}
                target={200}
                change={formatChange(metrics?.p95Latency || 0, 160, false)}
                description="Response time performance"
                loading={metricsLoading}
                onCardClick={() => onKPIClick?.('latency')}
              />
            </GridItem>
            <GridItem>
              <KPICard
                title="24h Cost"
                value={metrics?.cost24h || 0}
                unit="$"
                status="success"
                icon={DollarSign}
                change={formatChange(metrics?.cost24h || 0, 3200, false)}
                description="Infrastructure spending"
                loading={metricsLoading}
                onCardClick={() => onKPIClick?.('cost')}
              />
            </GridItem>
          </KPIGrid>
        </KPISection>

        {/* Main Chart Section */}
        <ChartSection span={8}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trust Analysis Activity (Last 24h)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {chartLoading ? (
                <div className="h-80 bg-muted rounded animate-pulse flex items-center justify-center">
                  <span className="text-muted-foreground">Loading chart...</span>
                </div>
              ) : (
                <LineChart
                  data={chartData}
                  height={320}
                  showGrid
                  showLegend
                  showTooltip
                  animate
                  onDataPointClick={onChartDataPointClick}
                />
              )}
            </CardContent>
          </Card>
        </ChartSection>

        {/* Widgets Section */}
        <WidgetSection span={4}>
          <div className="space-y-6 h-full">
            <ServiceHealthWidget />
            <CircuitBreakerWidget />
            <RecentAlertsWidget />
          </div>
        </WidgetSection>
      </DashboardGrid>
    );
  }
);

OverviewDashboard.displayName = 'OverviewDashboard';

export { ServiceHealthWidget, CircuitBreakerWidget, RecentAlertsWidget };
