import { Heart, MessageCircle, UserPlus, Repeat2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { Notification } from '../types';
import Avatar from '../components/Avatar';
import { useTimeAgo } from '../hooks/useTimeAgo';

function NotificationItem({ notif, index }: { notif: Notification; index: number }) {
  const { markNotificationRead } = useApp();
  const timeAgo = useTimeAgo(notif.createdAt);

  const icons = {
    like: <Heart size={16} fill="#ff6b6b" color="#ff6b6b" />,
    reply: <MessageCircle size={16} color="var(--accent-blue)" />,
    follow: <UserPlus size={16} color="var(--accent)" />,
    repost: <Repeat2 size={16} color="var(--success)" />,
  };

  const messages = {
    like: 'liked your ping',
    reply: 'replied to your ping',
    follow: 'started following you',
    repost: 'reposted your ping',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => markNotificationRead(notif.id)}
      style={{
        display: 'flex',
        gap: 12,
        padding: 14,
        background: notif.isRead ? 'transparent' : 'rgba(108, 92, 231, 0.05)',
        borderRadius: 'var(--card-radius)',
        marginBottom: 4,
        cursor: 'pointer',
        borderLeft: notif.isRead ? 'none' : '3px solid var(--accent)',
        transition: 'var(--transition)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar src={notif.fromUser.avatar} size={44} />
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          background: 'var(--bg-primary)',
          borderRadius: '50%',
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icons[notif.type]}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>{notif.fromUser.displayName}</span>
          {' '}{messages[notif.type]}
        </p>
        {notif.ping && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            "{notif.ping.text}"
          </p>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
          {timeAgo}
        </span>
      </div>
    </motion.div>
  );
}

export default function Notifications() {
  const { notifications } = useApp();

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80 }}>
      <div style={{
        padding: '16px 0 12px',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,15,20,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-tertiary)',
        }}>
          <p style={{ fontSize: 16 }}>No notifications yet</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>When someone interacts with your pings, you'll see it here.</p>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {notifications.map((n, i) => (
            <NotificationItem key={n.id} notif={n} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
