import { useMemo, useState } from 'react';
import {
  Layout,
  Menu,
  Drawer,
  Grid,
  Tooltip,
  Typography,
  Divider,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  InboxOutlined,
  BarChartOutlined,
  UserOutlined,
  PayCircleOutlined,
  SendOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

import { tokens } from '../theme/tokens';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/useAuth';

const { Sider } = Layout;

const navItems = [
  { key: '/', label: 'Inbox', icon: <InboxOutlined /> },
  { key: '/reports', label: 'Reports', icon: <BarChartOutlined /> },
  { key: '/contacts', label: 'Contacts', icon: <UserOutlined /> },
  { key: '/billing', label: 'Billing & Subscription', icon: <PayCircleOutlined /> },
  { key: '/campaigns', label: 'Campaigns', icon: <SendOutlined /> },
  { key: '/templates', label: 'Templates', icon: <FileTextOutlined /> },
  { key: '/settings', label: 'Settings', icon: <SettingOutlined /> },
];

export default function SideNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;

  const handleLogout = () => {
    logout();
    navigate('/logout', { replace: true });
  };

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return '/';
    for (const item of navItems) {
      if (item.key !== '/' && path.startsWith(item.key)) return item.key;
    }
    return '/';
  }, [location.pathname]);

  const menu = <Menu
    mode="inline"
    selectedKeys={[selectedKey]}
    onClick={({ key }) => { navigate(key); setMobileOpen(false); }}
    theme="light"
    inlineCollapsed={!mobile && collapsed}
    style={{ borderRight: 'none', background: 'transparent' }}
    items={navItems.map((item) => ({ key: item.key, icon: item.icon, label: item.label }))}
  />;

  if (mobile) return <>
    <button type="button" className="mobile-nav-trigger" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><MenuOutlined /></button>
    <Drawer title="Metalyte" placement="left" open={mobileOpen} onClose={() => setMobileOpen(false)} width="min(86vw, 320px)" styles={{ body: { padding: 8 } }}>
      <div className="mobile-nav-brand"><BrandLogo style={{ width: 190, maxWidth: '100%' }} /></div>
      {menu}
      <Divider />
      <button type="button" className="app-sider-logout" onClick={handleLogout}><LogoutOutlined /><span>Logout</span></button>
    </Drawer>
  </>;

  return (
    <Sider
      className="app-sider"
      width={tokens.sidebar.width}
      collapsedWidth={tokens.sidebar.widthCollapsed}
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      trigger={null}
      theme="light"
      breakpoint="lg"
      style={{
        background: tokens.sidebar.bg,
        borderRight: `1px solid ${tokens.sidebar.borderColor}`,
      }}
    >
      <div className="app-sider-inner">
        <div className={collapsed ? 'app-brand app-brand-collapsed' : 'app-brand'}>
          <div className="app-brand-main">
            <BrandLogo
              compact={collapsed}
              style={{
                width: collapsed ? 42 : 202,
                maxWidth: '100%',
              }}
            />

            <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="app-sider-collapse"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </Tooltip>
          </div>

            {!collapsed && (
              <Typography.Text className="app-brand-subtitle">
              Business Communication
            </Typography.Text>
          )}
        </div>

        <Divider style={{ borderColor: tokens.colors.border, margin: 0 }} />

        <div style={{ padding: collapsed ? '8px 4px' : '8px 16px', marginTop: 8, flex: 1 }}>
          {menu}
        </div>

        <div className="app-sider-footer" style={{ padding: collapsed ? 12 : 16 }}>
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
            <button
              type="button"
              aria-label="Logout"
              onClick={handleLogout}
              className={collapsed ? 'app-sider-logout centered' : 'app-sider-logout'}
            >
              <LogoutOutlined />
              {!collapsed && <span>Logout</span>}
            </button>
          </Tooltip>

        </div>
      </div>
    </Sider>
  );
}
