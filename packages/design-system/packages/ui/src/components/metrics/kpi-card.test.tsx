import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { KPICard, type TrendData, type ChangeIndicator } from './kpi-card';
import { Shield } from 'lucide-react';

const mockTrendData: TrendData[] = [
  { value: 100, timestamp: '2024-01-01' },
  { value: 120, timestamp: '2024-01-02' },
  { value: 110, timestamp: '2024-01-03' },
  { value: 130, timestamp: '2024-01-04' },
  { value: 125, timestamp: '2024-01-05' },
];

const mockChangeIncrease: ChangeIndicator = {
  value: 15,
  type: 'increase',
  period: 'vs last week',
  isPositive: true,
};

const mockChangeDecrease: ChangeIndicator = {
  value: 10,
  type: 'decrease',
  period: 'vs yesterday',
  isPositive: false,
};

describe('KPICard', () => {
  it('renders correctly with basic props', () => {
    render(
      <KPICard
        title="Test Metric"
        value={1234}
        unit="requests"
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument(); // Formatted value
    expect(screen.getByText('requests')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const { rerender } = render(<KPICard title="Test" value={1500} />);
    expect(screen.getByText('1.5K')).toBeInTheDocument();

    rerender(<KPICard title="Test" value={1500000} />);
    expect(screen.getByText('1.5M')).toBeInTheDocument();

    rerender(<KPICard title="Test" value={500} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('displays string values correctly', () => {
    render(<KPICard title="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<KPICard title="Loading Test" value={100} loading />);
    
    expect(screen.getByText('Loading Test')).toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays change indicator correctly', () => {
    render(
      <KPICard
        title="Test Metric"
        value={100}
        change={mockChangeIncrease}
      />
    );

    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('vs last week')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toHaveClass('font-medium');
  });

  it('handles decrease change correctly', () => {
    render(
      <KPICard
        title="Test Metric"
        value={100}
        change={mockChangeDecrease}
      />
    );

    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText('vs yesterday')).toBeInTheDocument();
  });

  it('handles neutral change correctly', () => {
    const neutralChange: ChangeIndicator = {
      value: 0,
      type: 'neutral',
      period: 'vs last week',
    };

    render(
      <KPICard
        title="Test Metric"
        value={100}
        change={neutralChange}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays status variants correctly', () => {
    const { rerender } = render(
      <KPICard title="Test" value={100} status="success" />
    );
    expect(screen.getByText('success')).toBeInTheDocument();

    rerender(<KPICard title="Test" value={100} status="warning" />);
    expect(screen.getByText('warning')).toBeInTheDocument();

    rerender(<KPICard title="Test" value={100} status="error" />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    render(
      <KPICard
        title="Security Score"
        value={95}
        icon={Shield}
      />
    );

    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <KPICard
        title="Test Metric"
        value={100}
        description="This is a test description"
      />
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('displays target progress correctly', () => {
    render(
      <KPICard
        title="Progress"
        value={75}
        target={100}
        unit="%"
      />
    );

    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles click events when onCardClick is provided', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <KPICard
        title="Clickable Card"
        value={100}
        onCardClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-label', 'View details for Clickable Card');

    await user.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation when clickable', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <KPICard
        title="Keyboard Test"
        value={100}
        onCardClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(
      <KPICard title="Test" value={100} size="compact" />
    );
    expect(screen.getByText('100')).toHaveClass('text-xl');

    rerender(<KPICard title="Test" value={100} size="large" />);
    expect(screen.getByText('100')).toHaveClass('text-3xl');

    rerender(<KPICard title="Test" value={100} size="default" />);
    expect(screen.getByText('100')).toHaveClass('text-2xl');
  });

  it('renders trend chart when trend data is provided', () => {
    render(
      <KPICard
        title="Trending Metric"
        value={125}
        trend={mockTrendData}
      />
    );

    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(document.querySelector('polyline')).toBeInTheDocument();
  });

  it('does not render trend chart with insufficient data', () => {
    const insufficientData: TrendData[] = [
      { value: 100, timestamp: '2024-01-01' }
    ];

    render(
      <KPICard
        title="No Trend"
        value={100}
        trend={insufficientData}
      />
    );

    // Should not contain trend chart SVG
    expect(document.querySelector('polyline')).not.toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(
      <KPICard
        title="Custom Class"
        value={100}
        className="custom-test-class"
        data-testid="kpi-card"
      />
    );

    expect(screen.getByTestId('kpi-card')).toHaveClass('custom-test-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <KPICard
        ref={ref}
        title="Ref Test"
        value={100}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
