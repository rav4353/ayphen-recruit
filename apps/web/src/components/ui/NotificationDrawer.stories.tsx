import type { Meta, StoryObj } from '@storybook/react';
import { NotificationDrawer, Notification } from './NotificationDrawer';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'application',
    title: 'New Application',
    message: 'John Doe applied for Senior Developer position',
    time: '5 min ago',
    read: false,
    link: '/applications/1',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview Scheduled',
    message: 'Interview with Jane Smith tomorrow at 2:00 PM',
    time: '1 hour ago',
    read: false,
    link: '/interviews/2',
  },
  {
    id: '3',
    type: 'message',
    title: 'New Message',
    message: 'HR Manager sent you a message about the hiring process',
    time: '2 hours ago',
    read: true,
    link: '/messages/3',
  },
  {
    id: '4',
    type: 'success',
    title: 'Offer Accepted',
    message: 'Michael Brown accepted the job offer',
    time: '1 day ago',
    read: true,
  },
];

const meta: Meta<typeof NotificationDrawer> = {
  title: 'UI/NotificationDrawer',
  component: NotificationDrawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    notifications: mockNotifications,
  },
};

export const WithUnreadNotifications: Story = {
  args: {
    notifications: mockNotifications.map((n, i) => ({ ...n, read: i > 1 })),
  },
};

export const AllRead: Story = {
  args: {
    notifications: mockNotifications.map((n) => ({ ...n, read: true })),
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
  },
};

export const ManyNotifications: Story = {
  args: {
    notifications: [
      ...mockNotifications,
      {
        id: '5',
        type: 'info',
        title: 'System Update',
        message: 'New features have been added to the platform',
        time: '2 days ago',
        read: true,
      },
      {
        id: '6',
        type: 'warning',
        title: 'Action Required',
        message: 'Please complete your profile setup',
        time: '3 days ago',
        read: false,
      },
      {
        id: '7',
        type: 'application',
        title: 'Application Update',
        message: 'Sarah Johnson moved to interview stage',
        time: '4 days ago',
        read: true,
      },
    ],
  },
};
