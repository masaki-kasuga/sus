import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Recycle,
  Factory,
  EllipsisVertical,
  Settings,
  PanelRightOpen,
  PanelLeftClose,
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { path: '/', label: 'ホーム', Icon: Home },
  { path: '/waste', label: '分類ゴミ', Icon: Recycle },
  { path: '/product', label: '材加不', Icon: Factory },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h1>Miyoshi Factory</h1>
        <div className="sidebar-header-actions">
          <button
            className="sidebar-toggle-button"
            aria-label={`サイドバーを${collapsed ? '開く' : '閉じる'}`}
            onClick={onToggle}
          >
            {collapsed ? (
              <PanelRightOpen size={18} strokeWidth={1.8} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.8} />
            )}
          </button>
          <button className="sidebar-header-button" aria-label="設定">
            <Settings size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(({ path, label, Icon }) => {
          const menuKey =
            path === '/'
              ? 'home'
              : path.startsWith('/waste')
              ? 'waste'
              : path.startsWith('/product')
              ? 'product'
              : 'other';
          const isActive =
            location.pathname === path ||
            (path !== '/' &&
              location.pathname.startsWith(path.split('/').slice(0, 2).join('/')));
          return (
            <Link
              key={path}
              to={path}
              className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              data-menu-key={menuKey}
              title={collapsed ? label : undefined}
            >
              <span className="menu-icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="menu-label">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">Taro Toyota</span>
          <button className="settings-button" aria-label="設定">
            <EllipsisVertical size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;