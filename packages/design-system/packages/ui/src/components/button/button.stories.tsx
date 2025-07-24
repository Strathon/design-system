import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Download, Plus, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Built with accessibility in mind and supports loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Shows loading spinner and disables the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render as a child component (useful for links)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of the button component.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different sizes available for the button component.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="outline">
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons for enhanced visual communication.',
      },
    },
  },
};

export const States: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Normal</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different states of the button component including loading and disabled states.',
      },
    },
  },
};

export const AsLink: Story = {
  render: () => (
    <Button asChild>
      <a href="https://strathon.com" target="_blank" rel="noopener noreferrer">
        Visit Strathon
      </a>
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button rendered as a link element using the asChild prop.',
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button aria-label="Save document">
        Save
      </Button>
      <Button disabled aria-describedby="save-help">
        Save (Disabled)
      </Button>
      <p id="save-help" className="text-sm text-muted-foreground">
        Complete all required fields to enable saving
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of proper accessibility attributes and ARIA labels.',
      },
    },
  },
};
