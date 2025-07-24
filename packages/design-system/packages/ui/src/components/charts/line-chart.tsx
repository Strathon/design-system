import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ChartDataPoint {
  timestamp: Date | string;
  value: number;
  label?: string;
  color?: string;
}

export interface LineChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: LineChartSeries[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  loading?: boolean;
  theme?: 'light' | 'dark';
  onDataPointClick?: (point: ChartDataPoint, series: LineChartSeries) => void;
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const defaultColors = [
  '#E00010', // Strathon Red
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const LoadingSkeleton = ({ width, height }: { width: number; height: number }) => (
  <div 
    className="animate-pulse bg-muted rounded-lg flex items-center justify-center"
    style={{ width, height }}
  >
    <div className="text-muted-foreground text-sm">Loading chart...</div>
  </div>
);

const formatTimestamp = (timestamp: Date | string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

const getDataBounds = (series: LineChartSeries[]) => {
  const allPoints = series.flatMap(s => s.data);
  const values = allPoints.map(p => p.value);
  const timestamps = allPoints.map(p => new Date(p.timestamp).getTime());

  return {
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
    minTime: Math.min(...timestamps),
    maxTime: Math.max(...timestamps),
  };
};

const createPath = (
  points: ChartDataPoint[],
  bounds: ReturnType<typeof getDataBounds>,
  dimensions: ChartDimensions
): string => {
  if (points.length === 0) return '';

  const { width, height, margin } = dimensions;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const pathCommands = points.map((point, index) => {
    const x = margin.left + ((new Date(point.timestamp).getTime() - bounds.minTime) / (bounds.maxTime - bounds.minTime)) * chartWidth;
    const y = margin.top + chartHeight - ((point.value - bounds.minValue) / (bounds.maxValue - bounds.minValue)) * chartHeight;
    
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  });

  return pathCommands.join(' ');
};

const createAreaPath = (
  points: ChartDataPoint[],
  bounds: ReturnType<typeof getDataBounds>,
  dimensions: ChartDimensions
): string => {
  if (points.length === 0) return '';

  const linePath = createPath(points, bounds, dimensions);
  const { width, height, margin } = dimensions;
  const chartHeight = height - margin.top - margin.bottom;
  const bottomY = margin.top + chartHeight;

  // Get first and last x coordinates
  const firstX = margin.left;
  const lastX = margin.left + (width - margin.left - margin.right);

  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
};

const GridLines = ({ 
  bounds, 
  dimensions, 
  theme 
}: { 
  bounds: ReturnType<typeof getDataBounds>; 
  dimensions: ChartDimensions;
  theme: 'light' | 'dark';
}) => {
  const { width, height, margin } = dimensions;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const gridColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  // Horizontal grid lines (for values)
  const horizontalLines = Array.from({ length: 5 }, (_, i) => {
    const y = margin.top + (i * chartHeight) / 4;
    return (
      <line
        key={`h-${i}`}
        x1={margin.left}
        y1={y}
        x2={margin.left + chartWidth}
        y2={y}
        stroke={gridColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  });

  // Vertical grid lines (for time)
  const verticalLines = Array.from({ length: 6 }, (_, i) => {
    const x = margin.left + (i * chartWidth) / 5;
    return (
      <line
        key={`v-${i}`}
        x1={x}
        y1={margin.top}
        x2={x}
        y2={margin.top + chartHeight}
        stroke={gridColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  });

  return (
    <g className="grid-lines">
      {horizontalLines}
      {verticalLines}
    </g>
  );
};

const Tooltip = ({ 
  point, 
  series, 
  position, 
  theme 
}: { 
  point: ChartDataPoint; 
  series: LineChartSeries; 
  position: { x: number; y: number };
  theme: 'light' | 'dark';
}) => {
  const bgColor = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#F9FAFB' : '#111827';
  const borderColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="font-medium">{series.name}</div>
      <div className="text-xs opacity-75">{formatTimestamp(point.timestamp)}</div>
      <div className="font-bold">{formatValue(point.value)}</div>
    </div>
  );
};

const Legend = ({ 
  series, 
  theme 
}: { 
  series: LineChartSeries[]; 
  theme: 'light' | 'dark';
}) => {
  const textColor = theme === 'dark' ? '#D1D5DB' : '#6B7280';

  return (
    <div className="flex flex-wrap gap-4 mt-4 justify-center">
      {series.map((s, index) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: s.color || defaultColors[index % defaultColors.length] }}
          />
          <span className="text-sm" style={{ color: textColor }}>
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({
    className,
    data,
    width = 800,
    height = 400,
    showGrid = true,
    showTooltip = true,
    showLegend = true,
    animate = true,
    loading = false,
    theme = 'light',
    onDataPointClick,
    ...props
  }, ref) => {
    const [hoveredPoint, setHoveredPoint] = React.useState<{
      point: ChartDataPoint;
      series: LineChartSeries;
      position: { x: number; y: number };
    } | null>(null);

    const dimensions: ChartDimensions = {
      width,
      height,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
    };

    if (loading) {
      return <LoadingSkeleton width={width} height={height} />;
    }

    if (!data || data.length === 0) {
      return (
        <div 
          className="flex items-center justify-center bg-muted rounded-lg text-muted-foreground"
          style={{ width, height }}
        >
          No data available
        </div>
      );
    }

    const bounds = getDataBounds(data);
    const chartWidth = width - dimensions.margin.left - dimensions.margin.right;
    const chartHeight = height - dimensions.margin.top - dimensions.margin.bottom;

    const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
      if (!showTooltip) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Find closest data point
      let closestPoint: { point: ChartDataPoint; series: LineChartSeries; distance: number } | null = null;

      data.forEach(series => {
        series.data.forEach(point => {
          const x = dimensions.margin.left + ((new Date(point.timestamp).getTime() - bounds.minTime) / (bounds.maxTime - bounds.minTime)) * chartWidth;
          const y = dimensions.margin.top + chartHeight - ((point.value - bounds.minValue) / (bounds.maxValue - bounds.minValue)) * chartHeight;
          
          const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
          
          if (!closestPoint || distance < closestPoint.distance) {
            closestPoint = { point, series, distance };
          }
        });
      });

      if (closestPoint && closestPoint.distance < 20) {
        setHoveredPoint({
          point: closestPoint.point,
          series: closestPoint.series,
          position: { x: mouseX, y: mouseY },
        });
      } else {
        setHoveredPoint(null);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        {...props}
      >
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="overflow-visible"
        >
          {showGrid && (
            <GridLines bounds={bounds} dimensions={dimensions} theme={theme} />
          )}
          
          {data.map((series, seriesIndex) => {
            const color = series.color || defaultColors[seriesIndex % defaultColors.length];
            const strokeWidth = series.strokeWidth || 2;
            
            return (
              <g key={series.id}>
                {series.fill && (
                  <path
                    d={createAreaPath(series.data, bounds, dimensions)}
                    fill={color}
                    fillOpacity={0.1}
                    className={animate ? 'transition-all duration-300' : ''}
                  />
                )}
                <path
                  d={createPath(series.data, bounds, dimensions)}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={animate ? 'transition-all duration-300' : ''}
                />
                
                {/* Data points */}
                {series.data.map((point, pointIndex) => {
                  const x = dimensions.margin.left + ((new Date(point.timestamp).getTime() - bounds.minTime) / (bounds.maxTime - bounds.minTime)) * chartWidth;
                  const y = dimensions.margin.top + chartHeight - ((point.value - bounds.minValue) / (bounds.maxValue - bounds.minValue)) * chartHeight;
                  
                  return (
                    <circle
                      key={`${series.id}-${pointIndex}`}
                      cx={x}
                      cy={y}
                      r={3}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      className={cn(
                        'cursor-pointer transition-all duration-150',
                        animate && 'hover:r-4'
                      )}
                      onClick={() => onDataPointClick?.(point, series)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hoveredPoint && showTooltip && (
          <Tooltip
            point={hoveredPoint.point}
            series={hoveredPoint.series}
            position={hoveredPoint.position}
            theme={theme}
          />
        )}

        {showLegend && <Legend series={data} theme={theme} />}
      </div>
    );
  }
);

LineChart.displayName = 'LineChart';

export { type ChartDataPoint, type LineChartSeries };
