import { Heart, MessageCircle, Repeat2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Ping } from '../types';
import { useApp } from '../context/AppContext';
import { useTimeAgo, formatCount } from '../hooks/useTimeAgo';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';

interface PingCardProps {
  ping: Ping;
  index?: number;
}

export default function PingCard({ ping, index = 0 }: PingCardProps) {
  const { toggleLike, toggleRepost } = useApp();
  const timeAgo = useTimeAgo(ping.createdAt);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--card-radius)',
        padding: 16,
        marginBottom: 12,
        border: ping.isPulse ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: ping.isPulse ? 'var(--shadow-glow)' : 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {ping.isPulse && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          <Zap size={12} fill="var(--accent)" />
          PULSE
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar
          src={ping.user.avatar}
          size={42}
          onClick={() => navigate(`/profile/${ping.user.username}`)}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${ping.user.username}`)}
            >
              {ping.user.displayName}
            </span>
            {ping.user.isVerified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              @{ping.user.username}
            </span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              · {timeAgo}
            </span>
          </div>

          <p style={{
            fontSize: 15,
            lineHeight: 1.5,
            marginBottom: ping.image ? 12 : 8,
            wordBreak: 'break-word',
          }}>
            {ping.text}
          </p>

          {ping.image && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 12,
              maxHeight: 300,
            }}>
              <img
                src={ping.image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: 4,
            marginTop: 4,
          }}>
            <ActionButton
              icon={<Heart size={18} fill={ping.isLiked ? '#ff6b6b' : 'none'} stroke={ping.isLiked ? '#ff6b6b' : 'var(--text-secondary)'} />}
              count={ping.likes}
              onClick={() => toggleLike(ping.id)}
              active={ping.isLiked}
              activeColor="#ff6b6b"
            />
            <ActionButton
              icon={<MessageCircle size={18} stroke="var(--text-secondary)" />}
              count={ping.replies}
              onClick={() => {}}
            />
            <ActionButton
              icon={<Repeat2 size={18} stroke={ping.isReposted ? 'var(--success)' : 'var(--text-secondary)'} />}
              count={ping.reposts}
              onClick={() => toggleRepost(ping.id)}
              active={ping.isReposted}
              activeColor="var(--success)"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}

function ActionButton({ icon, count, onClick, active, activeColor }: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: 13,
        color: active ? activeColor : 'var(--text-secondary)',
        transition: 'var(--transition)',
        background: 'transparent',
      }}
    >
      {icon}
      <span>{formatCount(count)}</span>
    </motion.button>
  );
}
