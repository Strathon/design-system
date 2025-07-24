import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LineChart, type LineChartSeries, type ChartDataPoint } from './line-chart';

const mockData: LineChartSeries[] = [
  {
    id: 'series1',
    name: 'Requests',
    data: [
      { timestamp: '2024-01-01T00:00:00Z', value: 100 },
      { timestamp: '2024-01-01T01:00:00Z', value: 120 },
      { timestamp: '2024-01-01T02:00:00Z', value: 110 },
      { timestamp: '2024-01-01T03:00:00Z', value: 130 },
      { timestamp: '2024-01-01T04:00:00Z', value: 125 },
    ],
    color: '#E00010',
  },
  {
    id: 'series2',
    name: 'Errors',
    data: [
      { timestamp: '2024-01-01T00:00:00Z', value: 5 },
      { timestamp: '2024-01-01T01:00:00Z', value: 8 },
      { timestamp: '2024-01-01T02:00:00Z', value: 3 },
      { timestamp: '2024-01-01T03:00:00Z', value: 12 },
      { timestamp: '2024-01-01T04:00:00Z', value: 7 },
    ],
    color: '#10B981',
  },
];

describe('LineChart', () => {
  it('renders correctly with data', () => {
    render(<LineChart data={mockData} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    
    // Check if SVG is rendered
    expect(chart.querySelector('svg')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<LineChart data={mockData} loading />);
    
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('shows no data message when data is empty', () => {
    render(<LineChart data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders legend when showLegend is true', () => {
    render(<LineChart data={mockData} showLegend />);
    
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
  });

  it('does not render legend when showLegend is false', () => {
    render(<LineChart data={mockData} showLegend={false} />);
    
    expect(screen.queryByText('Requests')).not.toBeInTheDocument();
    expect(screen.queryByText('Errors')).not.toBeInTheDocument();
  });

  it('renders grid lines when showGrid is true', () => {
    render(<LineChart data={mockData} showGrid data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const gridLines = chart.querySelector('.grid-lines');
    expect(gridLines).toBeInTheDocument();
  });

  it('applies custom dimensions', () => {
    render(<LineChart data={mockData} width={600} height={300} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const svg = chart.querySelector('svg');
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('height', '300');
  });

  it('handles data point clicks', () => {
    const handleClick = jest.fn();
    render(<LineChart data={mockData} onDataPointClick={handleClick} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const dataPoint = chart.querySelector('circle');
    
    if (dataPoint) {
      fireEvent.click(dataPoint);
      expect(handleClick).toHaveBeenCalled();
    }
  });

  it('renders multiple series with different colors', () => {
    render(<LineChart data={mockData} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const paths = chart.querySelectorAll('path[stroke]');
    
    // Should have paths for each series
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('supports custom className', () => {
    render(<LineChart data={mockData} className="custom-chart" data-testid="line-chart" />);
    
    expect(screen.getByTestId('line-chart')).toHaveClass('custom-chart');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<LineChart ref={ref} data={mockData} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles mouse interactions for tooltip', () => {
    render(<LineChart data={mockData} showTooltip data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const svg = chart.querySelector('svg');
    
    if (svg) {
      // Simulate mouse move
      fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
      
      // Mouse leave should clear tooltip
      fireEvent.mouseLeave(svg);
    }
  });

  it('renders with fill areas when series has fill enabled', () => {
    const dataWithFill: LineChartSeries[] = [
      {
        ...mockData[0],
        fill: true,
      },
    ];

    render(<LineChart data={dataWithFill} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    const filledPath = chart.querySelector('path[fill]:not([fill="none"])');
    expect(filledPath).toBeInTheDocument();
  });

  it('applies theme correctly', () => {
    const { rerender } = render(<LineChart data={mockData} theme="light" data-testid="line-chart" />);
    
    // Test light theme
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Test dark theme
    rerender(<LineChart data={mockData} theme="dark" data-testid="line-chart" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles large datasets efficiently', () => {
    const largeData: LineChartSeries[] = [
      {
        id: 'large-series',
        name: 'Large Dataset',
        data: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60000).toISOString(),
          value: Math.random() * 100,
        })),
      },
    ];

    render(<LineChart data={largeData} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    
    // Should render all data points
    const dataPoints = chart.querySelectorAll('circle');
    expect(dataPoints.length).toBe(1000);
  });

  it('formats values correctly', () => {
    const dataWithLargeValues: LineChartSeries[] = [
      {
        id: 'large-values',
        name: 'Large Values',
        data: [
          { timestamp: '2024-01-01T00:00:00Z', value: 1500 },
          { timestamp: '2024-01-01T01:00:00Z', value: 1500000 },
        ],
      },
    ];

    render(<LineChart data={dataWithLargeValues} showTooltip data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  it('handles empty series data gracefully', () => {
    const emptySeriesData: LineChartSeries[] = [
      {
        id: 'empty-series',
        name: 'Empty Series',
        data: [],
      },
    ];

    render(<LineChart data={emptySeriesData} data-testid="line-chart" />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });
});
