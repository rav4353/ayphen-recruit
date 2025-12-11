import type { Meta, StoryObj } from '@storybook/react';
import { LanguageSwitcher } from './LanguageSwitcher';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'UI/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['icon', 'dropdown'],
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

export const DropdownVariant: Story = {
  args: {
    variant: 'dropdown',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 items-center">
      <div>
        <p className="text-sm text-neutral-500 mb-2 text-center">Icon Variant</p>
        <LanguageSwitcher variant="icon" />
      </div>
      <div>
        <p className="text-sm text-neutral-500 mb-2 text-center">Dropdown Variant</p>
        <LanguageSwitcher variant="dropdown" />
      </div>
    </div>
  ),
};
