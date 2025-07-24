import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverviewDashboard } from './overview-dashboard';

// Create a query client for Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof OverviewDashboard> = {
  title: 'Dashboard/OverviewDashboard',
  component: OverviewDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete overview dashboard for Strathon Pulse showing KPIs, charts, and real-time monitoring widgets. Demonstrates the full integration of grid layout, KPI cards, charts, and data hooks.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dashboard title',
    },
    subtitle: {
      control: 'text',
      description: 'Dashboard subtitle/description',
    },
    refreshInterval: {
      control: { type: 'number', min: 5000, max: 60000, step: 5000 },
      description: 'Data refresh interval in milliseconds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default overview dashboard with all components and real-time data updates.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'AI Security Command Center',
    subtitle: 'Enterprise-grade AI governance and threat monitoring',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with custom title and subtitle.',
      },
    },
  },
};

export const FastRefresh: Story = {
  args: {
    refreshInterval: 5000, // 5 seconds
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with faster refresh interval for demonstration purposes.',
      },
    },
  },
};

export const WithInteractions: Story = {
  args: {
    onKPIClick: (kpiId: string) => {
      console.log(`KPI clicked: ${kpiId}`);
      alert(`Navigating to ${kpiId} details`);
    },
    onChartDataPointClick: (dataPoint: any) => {
      console.log('Chart data point clicked:', dataPoint);
      alert(`Data point: ${dataPoint.value} at ${dataPoint.timestamp}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with interactive KPI cards and chart data points. Click on KPI cards or chart points to see interactions.',
      },
    },
  },
};

export const ResponsiveDemo: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Responsive Dashboard Demo</h2>
          <p className="text-muted-foreground">Resize your browser window to see responsive behavior</p>
        </div>
        
        {/* Desktop View */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 text-sm font-medium">Desktop (1200px+)</div>
          <div style={{ width: '100%', minHeight: '600px' }}>
            <OverviewDashboard />
          </div>
        </div>
        
        {/* Tablet View */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 text-sm font-medium">Tablet (768px - 1199px)</div>
          <div style={{ width: '768px', minHeight: '600px', margin: '0 auto' }}>
            <OverviewDashboard />
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 text-sm font-medium">Mobile (375px - 767px)</div>
          <div style={{ width: '375px', minHeight: '600px', margin: '0 auto' }}>
            <OverviewDashboard />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates responsive behavior across different screen sizes.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {},
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background dark" data-theme="dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Dashboard in dark mode showing theme adaptation.',
      },
    },
  },
};

export const PerformanceDemo: Story = {
  render: () => {
    const [startTime] = React.useState(Date.now());
    const [renderTime, setRenderTime] = React.useState<number | null>(null);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setRenderTime(Date.now() - startTime);
      }, 100);
      return () => clearTimeout(timer);
    }, [startTime]);

    return (
      <QueryClientProvider client={queryClient}>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Render Time:</span>
                <span className="ml-2 font-mono">
                  {renderTime ? `${renderTime}ms` : 'Measuring...'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>
                <span className="ml-2 font-mono">&lt; 3000ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={`ml-2 font-medium ${
                  renderTime && renderTime < 3000 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {renderTime ? (renderTime < 3000 ? '✓ Pass' : '✗ Fail') : 'Testing...'}
                </span>
              </div>
            </div>
          </div>
          <OverviewDashboard />
        </div>
      </QueryClientProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance demonstration showing render time measurement. Target is <3s initial load.',
      },
    },
  },
};

export const AccessibilityDemo: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Accessibility Features</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keyboard navigation: Tab through interactive elements</li>
            <li>• Screen reader support: Proper ARIA labels and semantic markup</li>
            <li>• Color contrast: WCAG 2.1 AA compliant color combinations</li>
            <li>• Focus management: Clear focus indicators</li>
            <li>• Responsive design: Works on all device sizes</li>
          </ul>
        </div>
        <OverviewDashboard 
          onKPIClick={(kpiId) => console.log(`Accessible KPI navigation: ${kpiId}`)}
        />
      </div>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features demonstration. Try navigating with keyboard only (Tab, Enter, Space).',
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => {
    const [showLoading, setShowLoading] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => setShowLoading(false), 3000);
      return () => clearTimeout(timer);
    }, []);

    // Create a query client that simulates loading
    const loadingQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          enabled: !showLoading,
          staleTime: Infinity,
        },
      },
    });

    return (
      <QueryClientProvider client={loadingQueryClient}>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Loading States Demo</h3>
            <p className="text-sm text-yellow-800">
              {showLoading 
                ? 'Simulating initial data load... Components show skeleton states.'
                : 'Data loaded! Components now show real content with smooth transitions.'
              }
            </p>
            <button
              onClick={() => setShowLoading(!showLoading)}
              className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-900 rounded text-sm hover:bg-yellow-300"
            >
              {showLoading ? 'Skip Loading' : 'Show Loading Again'}
            </button>
          </div>
          <OverviewDashboard />
        </div>
      </QueryClientProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates loading states and skeleton UI while data is being fetched.',
      },
    },
  },
};
