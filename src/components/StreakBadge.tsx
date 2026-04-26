import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const sizes = {
    sm: { font: 12, icon: 12, pad: '4px 8px' },
    md: { font: 14, icon: 16, pad: '6px 12px' },
    lg: { font: 18, icon: 20, pad: '8px 16px' },
  };
  const s = sizes[size];

  if (streak <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: streak >= 7 ? 'linear-gradient(135deg, #ff6b6b, #ffd43b)' : 'var(--bg-tertiary)',
        padding: s.pad,
        borderRadius: 'var(--radius-full)',
        fontSize: s.font,
        fontWeight: 700,
        color: streak >= 7 ? '#fff' : 'var(--warning)',
      }}
    >
      <Flame size={s.icon} fill={streak >= 7 ? '#fff' : 'var(--warning)'} />
      {streak}
    </motion.div>
  );
}
