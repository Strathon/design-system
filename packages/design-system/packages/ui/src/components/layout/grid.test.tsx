import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  Grid, 
  GridItem, 
  DashboardGrid, 
  KPISection, 
  KPIGrid,
  ChartSection,
  WidgetSection,
  useBreakpoint 
} from './grid';

// Mock window.innerWidth for breakpoint testing
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Grid', () => {
  it('renders correctly with default props', () => {
    render(<Grid data-testid="grid">Content</Grid>);
    const grid = screen.getByTestId('grid');
    
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid', 'w-full');
  });

  it('applies column variants correctly', () => {
    const { rerender } = render(<Grid cols={4} data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');

    rerender(<Grid cols={6} data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-6');
  });

  it('applies gap variants correctly', () => {
    const { rerender } = render(<Grid gap="sm" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('gap-2');

    rerender(<Grid gap="lg" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('gap-6');
  });

  it('applies alignment variants correctly', () => {
    const { rerender } = render(<Grid align="center" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('items-center');

    rerender(<Grid align="start" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('items-start');
  });

  it('supports custom className', () => {
    render(<Grid className="custom-class" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('custom-class');
  });

  it('supports custom component via as prop', () => {
    render(<Grid as="section" data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid').tagName).toBe('SECTION');
  });
});

describe('GridItem', () => {
  it('renders correctly with default props', () => {
    render(<GridItem data-testid="grid-item">Content</GridItem>);
    const gridItem = screen.getByTestId('grid-item');
    
    expect(gridItem).toBeInTheDocument();
    expect(gridItem).toHaveClass('w-full');
  });

  it('applies span variants correctly', () => {
    const { rerender } = render(<GridItem span={4} data-testid="grid-item">Content</GridItem>);
    expect(screen.getByTestId('grid-item')).toHaveClass('col-span-1', 'md:col-span-2', 'lg:col-span-4');

    rerender(<GridItem span={12} data-testid="grid-item">Content</GridItem>);
    expect(screen.getByTestId('grid-item')).toHaveClass('col-span-full');
  });

  it('applies order variants correctly', () => {
    const { rerender } = render(<GridItem order="first" data-testid="grid-item">Content</GridItem>);
    expect(screen.getByTestId('grid-item')).toHaveClass('order-first');

    rerender(<GridItem order={2} data-testid="grid-item">Content</GridItem>);
    expect(screen.getByTestId('grid-item')).toHaveClass('order-2');
  });
});

describe('Dashboard Layout Components', () => {
  it('renders DashboardGrid with correct classes', () => {
    render(<DashboardGrid data-testid="dashboard-grid">Content</DashboardGrid>);
    const dashboardGrid = screen.getByTestId('dashboard-grid');
    
    expect(dashboardGrid).toHaveClass('min-h-screen', 'p-4', 'md:p-6', 'lg:p-8');
  });

  it('renders KPISection with correct span', () => {
    render(<KPISection data-testid="kpi-section">Content</KPISection>);
    const kpiSection = screen.getByTestId('kpi-section');
    
    expect(kpiSection).toHaveClass('col-span-full', 'mb-6');
  });

  it('renders KPIGrid with 4 columns', () => {
    render(<KPIGrid data-testid="kpi-grid">Content</KPIGrid>);
    const kpiGrid = screen.getByTestId('kpi-grid');
    
    expect(kpiGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('renders ChartSection with correct span and height', () => {
    render(<ChartSection data-testid="chart-section">Content</ChartSection>);
    const chartSection = screen.getByTestId('chart-section');
    
    expect(chartSection).toHaveClass('min-h-[400px]');
  });

  it('renders WidgetSection with correct span and height', () => {
    render(<WidgetSection data-testid="widget-section">Content</WidgetSection>);
    const widgetSection = screen.getByTestId('widget-section');
    
    expect(widgetSection).toHaveClass('min-h-[400px]');
  });
});

describe('useBreakpoint hook', () => {
  const TestComponent = () => {
    const breakpoint = useBreakpoint();
    return <div data-testid="breakpoint">{breakpoint}</div>;
  };

  beforeEach(() => {
    // Reset to default
    mockInnerWidth(1024);
  });

  it('returns correct breakpoint for mobile', () => {
    mockInnerWidth(375);
    render(<TestComponent />);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('sm');
  });

  it('returns correct breakpoint for tablet', () => {
    mockInnerWidth(768);
    render(<TestComponent />);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');
  });

  it('returns correct breakpoint for desktop', () => {
    mockInnerWidth(1024);
    render(<TestComponent />);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('lg');
  });

  it('returns correct breakpoint for large desktop', () => {
    mockInnerWidth(1280);
    render(<TestComponent />);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('xl');
  });

  it('returns correct breakpoint for extra large', () => {
    mockInnerWidth(1536);
    render(<TestComponent />);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('2xl');
  });

  it('updates breakpoint on window resize', () => {
    render(<TestComponent />);
    
    // Start with desktop
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('lg');
    
    // Resize to mobile
    mockInnerWidth(375);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('sm');
    
    // Resize to tablet
    mockInnerWidth(768);
    expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');
  });
});
