import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Search, User } from 'lucide-react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    leftIcon: <Mail size={18} />,
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address',
    leftIcon: <Mail size={18} />,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    hint: 'This will be your public display name',
    leftIcon: <User size={18} />,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input label="Default" placeholder="Enter text..." />
      <Input label="With Icon" placeholder="Search..." leftIcon={<Search size={18} />} />
      <Input label="Password" type="password" placeholder="Enter password" />
      <Input label="With Error" placeholder="Email" error="Invalid email" leftIcon={<Mail size={18} />} />
      <Input label="With Hint" placeholder="Username" hint="Choose wisely" />
      <Input label="Disabled" placeholder="Cannot edit" disabled />
    </div>
  ),
};
