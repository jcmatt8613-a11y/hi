import { Home, Search, Bell, User, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/explore', icon: Search, label: 'Explore' },
  { path: '/create', icon: Plus, label: 'Create' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadNotifCount, setCreateOpen } = useApp();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      background: 'rgba(15, 15, 20, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {NAV_ITEMS.map(item => {
        const isCreate = item.path === '/create';
        const isActive = !isCreate && location.pathname === item.path;
        const isNotif = item.path === '/notifications';
        const Icon = item.icon;

        if (isCreate) {
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCreateOpen(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--pulse-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px var(--accent-glow)',
                marginTop: -20,
              }}
            >
              <Plus size={24} color="white" strokeWidth={2.5} />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 16px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={22}
                stroke={isActive ? 'var(--accent)' : 'var(--text-secondary)'}
                fill={isActive ? 'var(--accent)' : 'none'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {isNotif && unreadNotifCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  background: 'var(--danger)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {unreadNotifCount}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
