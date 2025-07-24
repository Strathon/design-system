import type { Meta, StoryObj } from '@storybook/react';
import { KPICard, type TrendData, type ChangeIndicator } from './kpi-card';
import { Shield, Activity, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Grid, GridItem } from '../layout/grid';

const meta: Meta<typeof KPICard> = {
  title: 'Components/KPICard',
  component: KPICard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enterprise-grade KPI card component for displaying key performance indicators with trend visualization, status indicators, and interactive features. Perfect for dashboards and monitoring interfaces.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title/label for the KPI metric',
    },
    value: {
      control: 'text',
      description: 'The main value to display (number or string)',
    },
    unit: {
      control: 'text',
      description: 'Optional unit to display after the value',
    },
    status: {
      control: { type: 'select' },
      options: ['neutral', 'success', 'warning', 'error'],
      description: 'Visual status indicator',
    },
    size: {
      control: { type: 'select' },
      options: ['compact', 'default', 'large'],
      description: 'Size variant of the card',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading skeleton state',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample trend data
const sampleTrendData: TrendData[] = [
  { value: 100, timestamp: '2024-01-01T00:00:00Z' },
  { value: 120, timestamp: '2024-01-01T04:00:00Z' },
  { value: 110, timestamp: '2024-01-01T08:00:00Z' },
  { value: 130, timestamp: '2024-01-01T12:00:00Z' },
  { value: 125, timestamp: '2024-01-01T16:00:00Z' },
  { value: 140, timestamp: '2024-01-01T20:00:00Z' },
  { value: 135, timestamp: '2024-01-02T00:00:00Z' },
];

const positiveChange: ChangeIndicator = {
  value: 15.3,
  type: 'increase',
  period: 'vs last week',
  isPositive: true,
};

const negativeChange: ChangeIndicator = {
  value: 8.2,
  type: 'decrease',
  period: 'vs yesterday',
  isPositive: false,
};

const costDecrease: ChangeIndicator = {
  value: 12.5,
  type: 'decrease',
  period: 'vs last month',
  isPositive: true, // Cost decrease is positive
};

export const Default: Story = {
  args: {
    title: 'Active Users',
    value: 1234,
    unit: 'users',
  },
};

export const WithChange: Story = {
  args: {
    title: 'Revenue',
    value: 45678,
    unit: '$',
    change: positiveChange,
  },
};

export const WithTrend: Story = {
  args: {
    title: 'API Requests',
    value: 125000,
    unit: 'req/min',
    change: positiveChange,
    trend: sampleTrendData,
  },
};

export const WithTarget: Story = {
  args: {
    title: 'Completion Rate',
    value: 87,
    unit: '%',
    target: 95,
    change: {
      value: 5.2,
      type: 'increase',
      period: 'vs last week',
      isPositive: true,
    },
  },
};

export const StatusVariants: Story = {
  render: () => (
    <Grid cols={2} gap="md" className="w-full max-w-4xl">
      <GridItem>
        <KPICard
          title="System Health"
          value="Healthy"
          status="success"
          icon={Shield}
          description="All systems operational"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Warning Alerts"
          value={3}
          status="warning"
          icon={AlertTriangle}
          description="Requires attention"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Critical Issues"
          value={1}
          status="error"
          icon={AlertTriangle}
          description="Immediate action required"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Total Requests"
          value={98765}
          status="neutral"
          icon={Activity}
          description="Last 24 hours"
        />
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different status variants with appropriate colors and icons.',
      },
    },
  },
};

export const SizeVariants: Story = {
  render: () => (
    <Grid cols={3} gap="md" className="w-full max-w-6xl">
      <GridItem>
        <KPICard
          title="Compact Size"
          value={1234}
          unit="items"
          size="compact"
          change={positiveChange}
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Default Size"
          value={5678}
          unit="items"
          size="default"
          change={positiveChange}
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Large Size"
          value={9012}
          unit="items"
          size="large"
          change={positiveChange}
        />
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants for various use cases.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    title: 'Loading Metric',
    value: 0,
    loading: true,
  },
};

export const ClickableCard: Story = {
  args: {
    title: 'Clickable KPI',
    value: 42,
    unit: 'items',
    change: positiveChange,
    onCardClick: () => alert('KPI card clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive KPI card that responds to clicks and keyboard navigation.',
      },
    },
  },
};

export const StrathonDashboard: Story = {
  render: () => (
    <Grid cols={4} gap="lg" className="w-full max-w-7xl">
      <GridItem>
        <KPICard
          title="Active Threats"
          value={12}
          status="error"
          icon={AlertTriangle}
          change={{
            value: 3,
            type: 'increase',
            period: 'vs yesterday',
            isPositive: false,
          }}
          description="Security violations detected"
          onCardClick={() => console.log('Navigate to threats')}
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Resilience Score"
          value={98}
          unit="%"
          status="success"
          icon={Shield}
          target={95}
          change={{
            value: 2,
            type: 'increase',
            period: 'vs last week',
            isPositive: true,
          }}
          trend={sampleTrendData}
          description="AI system reliability"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="P95 Latency"
          value={145}
          unit="ms"
          status="warning"
          icon={Activity}
          target={200}
          change={{
            value: 5,
            type: 'decrease',
            period: 'vs yesterday',
            isPositive: true,
          }}
          trend={sampleTrendData}
          description="Response time performance"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="24h Cost"
          value={2847}
          unit="$"
          status="success"
          icon={DollarSign}
          change={costDecrease}
          trend={sampleTrendData}
          description="Infrastructure spending"
        />
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world example showing Strathon dashboard KPIs with various states and interactions.',
      },
    },
  },
};

export const NumberFormatting: Story = {
  render: () => (
    <Grid cols={3} gap="md" className="w-full max-w-4xl">
      <GridItem>
        <KPICard
          title="Small Number"
          value={42}
          unit="items"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Thousands"
          value={1234}
          unit="requests"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Millions"
          value={1234567}
          unit="events"
        />
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates automatic number formatting for different scales.',
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => (
    <Grid cols={2} gap="md" className="w-full max-w-4xl">
      <GridItem>
        <KPICard
          title="Keyboard Navigation"
          value={100}
          unit="%"
          onCardClick={() => console.log('Accessible click')}
          description="Press Tab to focus, Enter or Space to activate"
        />
      </GridItem>
      <GridItem>
        <KPICard
          title="Screen Reader Friendly"
          value={95}
          unit="score"
          status="success"
          description="Proper ARIA labels and semantic markup"
        />
      </GridItem>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including keyboard navigation and screen reader support.',
      },
    },
  },
};
