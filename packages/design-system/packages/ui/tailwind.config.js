/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../../apps/storybook/stories/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // Strathon Design System - Typography
      fontFamily: {
        'aeonik': ['Aeonik', 'Inter', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      
      // Strathon Design System - Colors
      colors: {
        // CSS Custom Properties for theming
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Strathon Brand Colors (for direct usage)
        'strathon': {
          'red': {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#E00010', // Primary brand color
            600: '#CC000E', // Hover state
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D'
          },
          'black': '#111827',
          'gray': {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827'
          }
        },
        
        // Semantic Colors
        'success': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          700: '#047857'
        },
        'warning': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          700: '#B45309'
        },
        'error': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          700: '#C53030'
        },
        'info': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          700: '#1D4ED8'
        }
      },
      
      // Strathon Design System - Border Radius
      borderRadius: {
        'lg': '12px', // Cards, modals
        'md': '8px',  // Buttons, inputs, badges
        'sm': '4px',  // Small elements
        // CSS Custom Properties
        'DEFAULT': 'var(--radius)',
      },
      
      // Strathon Design System - Shadows
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      
      // Animation timing
      transitionDuration: {
        '150': '150ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'ease-in-out',
      },
      
      // Keyframes for loading animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(4px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 150ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
