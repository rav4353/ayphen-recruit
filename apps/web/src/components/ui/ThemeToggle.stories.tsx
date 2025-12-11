import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['icon', 'buttons'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const IconVariant: Story = {
  args: {
    variant: 'icon',
  },
};

export const ButtonsVariant: Story = {
  args: {
    variant: 'buttons',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 items-center">
      <div>
        <p className="text-sm text-neutral-500 mb-2 text-center">Icon Variant</p>
        <ThemeToggle variant="icon" />
      </div>
      <div>
        <p className="text-sm text-neutral-500 mb-2 text-center">Buttons Variant</p>
        <ThemeToggle variant="buttons" />
      </div>
    </div>
  ),
};
