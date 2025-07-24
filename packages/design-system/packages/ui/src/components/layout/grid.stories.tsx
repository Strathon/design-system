import type { Meta, StoryObj } from '@storybook/react';
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
import { Card, CardContent, CardHeader, CardTitle } from '../card/card';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A responsive grid system built on CSS Grid with Tailwind CSS. Supports 12-column layouts with responsive breakpoints and dashboard-specific components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cols: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 6, 12],
      description: 'Number of columns in the grid',
    },
    gap: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between grid items',
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end', 'stretch'],
      description: 'Vertical alignment of grid items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Demo card component for examples
const DemoCard = ({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      {children || <div className="h-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">Content</div>}
    </CardContent>
  </Card>
);

export const BasicGrid: Story = {
  render: () => (
    <div className="p-6">
      <Grid cols={3} gap="md">
        <GridItem><DemoCard title="Item 1" /></GridItem>
        <GridItem><DemoCard title="Item 2" /></GridItem>
        <GridItem><DemoCard title="Item 3" /></GridItem>
        <GridItem><DemoCard title="Item 4" /></GridItem>
        <GridItem><DemoCard title="Item 5" /></GridItem>
        <GridItem><DemoCard title="Item 6" /></GridItem>
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic 3-column grid with responsive behavior. Items automatically wrap to fewer columns on smaller screens.',
      },
    },
  },
};

export const ResponsiveColumns: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">12-Column Grid</h3>
        <Grid cols={12} gap="sm">
          {Array.from({ length: 12 }, (_, i) => (
            <GridItem key={i} span={1}>
              <DemoCard title={`Col ${i + 1}`} />
            </GridItem>
          ))}
        </Grid>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">6-Column Grid</h3>
        <Grid cols={6} gap="md">
          {Array.from({ length: 6 }, (_, i) => (
            <GridItem key={i}>
              <DemoCard title={`Item ${i + 1}`} />
            </GridItem>
          ))}
        </Grid>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">4-Column Grid</h3>
        <Grid cols={4} gap="lg">
          {Array.from({ length: 4 }, (_, i) => (
            <GridItem key={i}>
              <DemoCard title={`Card ${i + 1}`} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different column configurations showing responsive behavior across breakpoints.',
      },
    },
  },
};

export const CustomSpans: Story = {
  render: () => (
    <div className="p-6">
      <Grid cols={12} gap="md">
        <GridItem span={12}>
          <DemoCard title="Full Width (12 columns)" />
        </GridItem>
        <GridItem span={8}>
          <DemoCard title="Main Content (8 columns)" />
        </GridItem>
        <GridItem span={4}>
          <DemoCard title="Sidebar (4 columns)" />
        </GridItem>
        <GridItem span={6}>
          <DemoCard title="Half Width (6 columns)" />
        </GridItem>
        <GridItem span={6}>
          <DemoCard title="Half Width (6 columns)" />
        </GridItem>
        <GridItem span={4}>
          <DemoCard title="Third (4 columns)" />
        </GridItem>
        <GridItem span={4}>
          <DemoCard title="Third (4 columns)" />
        </GridItem>
        <GridItem span={4}>
          <DemoCard title="Third (4 columns)" />
        </GridItem>
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom column spans for creating complex layouts. Spans are responsive and adapt to smaller screens.',
      },
    },
  },
};

export const DashboardLayout: Story = {
  render: () => (
    <DashboardGrid>
      {/* KPI Section */}
      <KPISection>
        <div className="mb-4">
          <h2 className="text-heading-2 font-semibold">Overview Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring and key performance indicators</p>
        </div>
        <KPIGrid>
          <GridItem>
            <DemoCard title="Active Threats" className="border-red-200 bg-red-50">
              <div className="text-2xl font-bold text-red-600">12</div>
              <div className="text-sm text-red-500">+3 from yesterday</div>
            </DemoCard>
          </GridItem>
          <GridItem>
            <DemoCard title="Resilience Score" className="border-green-200 bg-green-50">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-green-500">+2% from yesterday</div>
            </DemoCard>
          </GridItem>
          <GridItem>
            <DemoCard title="P95 Latency" className="border-blue-200 bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">145ms</div>
              <div className="text-sm text-blue-500">-5ms from yesterday</div>
            </DemoCard>
          </GridItem>
          <GridItem>
            <DemoCard title="24h Cost" className="border-purple-200 bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">$2,847</div>
              <div className="text-sm text-purple-500">-12% from yesterday</div>
            </DemoCard>
          </GridItem>
        </KPIGrid>
      </KPISection>

      {/* Charts Section */}
      <ChartSection span={8}>
        <DemoCard title="Trust Analysis Activity (Last 24h)" className="h-full">
          <div className="h-80 bg-muted rounded flex items-center justify-center text-muted-foreground">
            Line Chart Component
          </div>
        </DemoCard>
      </ChartSection>

      {/* Widgets Section */}
      <WidgetSection span={4}>
        <div className="space-y-4 h-full">
          <DemoCard title="Top Policy Violations" className="flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>PII Detection</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Prompt Injection</span>
                <span className="font-medium">18</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data Leakage</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </DemoCard>
          
          <DemoCard title="Circuit Breaker Status" className="flex-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>API Gateway</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Auth Service</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>ML Pipeline</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </DemoCard>
        </div>
      </WidgetSection>
    </DashboardGrid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete dashboard layout using specialized grid components. Shows KPI cards, main chart area, and sidebar widgets.',
      },
    },
  },
};

export const BreakpointDemo: Story = {
  render: () => {
    const BreakpointIndicator = () => {
      const breakpoint = useBreakpoint();
      return (
        <div className="p-4 bg-primary text-primary-foreground rounded-lg text-center">
          <div className="text-lg font-semibold">Current Breakpoint</div>
          <div className="text-2xl font-bold">{breakpoint}</div>
          <div className="text-sm opacity-90">Resize window to see changes</div>
        </div>
      );
    };

    return (
      <div className="p-6">
        <BreakpointIndicator />
        <div className="mt-6">
          <Grid cols={4} gap="md">
            <GridItem className="block sm:hidden">
              <DemoCard title="Mobile Only" className="border-red-200" />
            </GridItem>
            <GridItem className="hidden sm:block md:hidden">
              <DemoCard title="Tablet Only" className="border-blue-200" />
            </GridItem>
            <GridItem className="hidden md:block lg:hidden">
              <DemoCard title="Desktop Only" className="border-green-200" />
            </GridItem>
            <GridItem className="hidden lg:block">
              <DemoCard title="Large+ Only" className="border-purple-200" />
            </GridItem>
          </Grid>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates responsive breakpoints and the useBreakpoint hook. Resize the viewport to see different layouts.',
      },
    },
  },
};
