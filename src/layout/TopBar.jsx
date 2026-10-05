import { useState } from 'react';
import {
  Layout,
  Input,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  PlusOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  TeamOutlined,
  FilterOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../theme/tokens';
import { useAuth } from '../context/useAuth';

const { Header } = Layout;

export default function TopBar({ onNewMessage }) {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All', icon: <MessageOutlined /> },
    { key: 'unread', label: 'Unread', icon: <BellOutlined /> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <CheckCircleOutlined /> },
    { key: 'sms', label: 'SMS', icon: <ClockCircleOutlined /> },
    { key: 'email', label: 'Email', icon: <MessageOutlined /> },
    { key: 'archived', label: 'Archived', icon: <SettingOutlined /> },
    { key: 'pinned', label: 'Pinned', icon: <ClockCircleOutlined /> },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search logic
    console.log('Search:', searchValue);
  };

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setFilterOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/logout', { replace: true });
  };

  const userMenuItems = [
    {
      key: 'current-organization',
      label: organization?.name || 'Current organization',
      icon: <CheckCircleOutlined />,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'preferences',
      label: 'Preferences',
      icon: <SettingOutlined />,
    },
    {
      key: 'organization',
      label: 'Organization Settings',
      icon: <TeamOutlined />,
    },
    {
      key: 'create-organization',
      label: 'Create organization',
      icon: <PlusOutlined />,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const notificationItems = [
    {
      key: '1',
      label: 'New message from John Doe',
      description: '2 minutes ago',
      unread: true,
    },
    {
      key: '2',
      label: 'Campaign "Summer Sale" completed',
      description: '1 hour ago',
      unread: false,
    },
    {
      key: '3',
      label: 'Billing invoice #12345 ready',
      description: '3 hours ago',
      unread: true,
    },
  ];

  return (
    <Header
      className="app-topbar"
      style={{
        height: tokens.header.height,
        padding: `0 ${tokens.spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        borderBottom: `1px solid ${tokens.header.borderColor}`,
        background: tokens.header.bg,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left Side: Search & Filters */}
      <Space style={{ flex: 1, maxWidth: '100%' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
          <form onSubmit={handleSearch}>
            <Input
              className="topbar-search"
              placeholder="Search conversations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              prefix={<SearchOutlined style={{ color: tokens.colors.textMuted }} />}
              size="middle"
              style={{
                background: tokens.colors.bgSecondary,
                border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textPrimary,
                borderRadius: 12,
                '&:hover, &:focus-within': {
                  borderColor: tokens.colors.primary,
                  boxShadow: `0 0 0 2px ${tokens.colors.primary}33`,
                },
              }}
              onPressEnter={handleSearch}
            />
          </form>
        </div>

        {/* Filters */}
        <Dropdown
          menu={{
            items: filters.map((f) => ({
              key: f.key,
              label: f.label,
              icon: f.icon,
              onClick: () => handleFilterChange(f.key),
            })),
          }}
          trigger={['click']}
          open={filterOpen}
          onOpenChange={setFilterOpen}
          overlayClassName="filter-dropdown"
        >
          <Tooltip title="Filters">
            <Button
              type="default"
              size="middle"
              className="topbar-filter-button"
              icon={
                activeFilter !== 'all' ? (
                  <Badge count={1} style={{ background: tokens.colors.danger }}>
                    <FilterOutlined />
                  </Badge>
                ) : (
                  <FilterOutlined />
                )
              }
              style={{
                background: tokens.colors.bgSecondary,
                border: `1px solid ${tokens.colors.border}`,
                color: tokens.colors.textPrimary,
                borderRadius: 12,
                '&:hover': {
                  borderColor: tokens.colors.primary,
                  color: tokens.colors.primary,
                },
              }}
            />
          </Tooltip>
        </Dropdown>
      </Space>

      {/* Right Side: Quick Actions, Notifications, Organization, User */}
      <Space className="topbar-actions" style={{ alignItems: 'center', gap: tokens.spacing.sm }}>
        {/* Notifications */}
        <Tooltip title="Notifications">
          <Dropdown
            menu={{
              items: notificationItems.map((n) => ({
                key: n.key,
                label: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{n.label}</span>
                      {n.unread && (
                        <Badge dot color={tokens.colors.primary} />
                      )}
                    </div>
                    <small style={{ color: tokens.colors.textMuted }}>{n.description}</small>
                  </div>
                ),
              })),
            }}
            trigger={['click']}
          >
            <Badge
              count={notificationItems.filter((n) => n.unread).length}
              offset={[0, 0]}
              style={{
                background: tokens.colors.danger,
                color: tokens.colors.textPrimary,
              }}
            >
              <Button
                type="default"
                size="middle"
                className="topbar-icon-button topbar-notification-button"
                icon={<BellOutlined />}
                style={{
                  color: tokens.colors.textPrimary,
                  border: 'none',
                  background: 'transparent',
                  width: 40,
                  '&:hover': {
                    borderColor: tokens.colors.primary,
                    color: tokens.colors.primary,
                  },
                }}
              />
            </Badge>
          </Dropdown>
        </Tooltip>

        {/* User Avatar Dropdown */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === 'logout') return;
              if (key === 'create-organization') navigate('/settings?tab=organization');
              else if (key === 'organization') navigate('/settings?tab=organization');
              else if (key === 'profile') navigate('/settings?tab=profile');
              else if (key === 'preferences') navigate('/settings?tab=appearance');
            },
          }}
          trigger={['click']}
        >
          <Space style={{ alignItems: 'center', gap: 8 }}>
            <Avatar
              size={40}
              className="topbar-avatar"
              style={{ background: tokens.colors.primary, cursor: 'pointer' }}
            >
              {(user?.fullName || user?.name || user?.email || 'N').slice(0, 1).toUpperCase()}
            </Avatar>
            <div style={{ display: 'none' }}>
              <DownOutlined />
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
