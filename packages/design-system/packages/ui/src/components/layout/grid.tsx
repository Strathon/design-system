import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const gridVariants = cva(
  'grid w-full',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
        12: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
    },
    defaultVariants: {
      cols: 12,
      gap: 'md',
      align: 'stretch',
    },
  }
);

const gridItemVariants = cva(
  'w-full',
  {
    variants: {
      span: {
        1: 'col-span-1',
        2: 'col-span-1 md:col-span-2',
        3: 'col-span-1 md:col-span-2 lg:col-span-3',
        4: 'col-span-1 md:col-span-2 lg:col-span-4',
        6: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-6',
        8: 'col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6 2xl:col-span-8',
        12: 'col-span-full',
        auto: 'col-auto',
      },
      order: {
        first: 'order-first',
        last: 'order-last',
        none: 'order-none',
        1: 'order-1',
        2: 'order-2',
        3: 'order-3',
        4: 'order-4',
      },
    },
    defaultVariants: {
      span: 'auto',
      order: 'none',
    },
  }
);

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  as?: React.ElementType;
}

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {
  as?: React.ElementType;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(gridVariants({ cols, gap, align }), className)}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, order, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(gridItemVariants({ span, order }), className)}
        {...props}
      />
    );
  }
);
GridItem.displayName = 'GridItem';

// Dashboard-specific layout components
const DashboardGrid = React.forwardRef<HTMLDivElement, Omit<GridProps, 'cols'>>(
  ({ className, gap = 'lg', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        cols={12}
        gap={gap}
        className={cn('min-h-screen p-4 md:p-6 lg:p-8', className)}
        {...props}
      />
    );
  }
);
DashboardGrid.displayName = 'DashboardGrid';

const KPISection = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <GridItem
        ref={ref}
        span={12}
        className={cn('mb-6', className)}
        {...props}
      />
    );
  }
);
KPISection.displayName = 'KPISection';

const KPIGrid = React.forwardRef<HTMLDivElement, Omit<GridProps, 'cols'>>(
  ({ className, gap = 'md', ...props }, ref) => {
    return (
      <Grid
        ref={ref}
        cols={4}
        gap={gap}
        className={cn('w-full', className)}
        {...props}
      />
    );
  }
);
KPIGrid.displayName = 'KPIGrid';

const ChartSection = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span = 8, ...props }, ref) => {
    return (
      <GridItem
        ref={ref}
        span={span}
        className={cn('min-h-[400px]', className)}
        {...props}
      />
    );
  }
);
ChartSection.displayName = 'ChartSection';

const WidgetSection = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span = 4, ...props }, ref) => {
    return (
      <GridItem
        ref={ref}
        span={span}
        className={cn('min-h-[400px]', className)}
        {...props}
      />
    );
  }
);
WidgetSection.displayName = 'WidgetSection';

// Responsive breakpoint utilities
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const;

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof breakpoints>('sm');

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

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
};
