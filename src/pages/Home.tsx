import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import PingCard from '../components/PingCard';
import StreakBadge from '../components/StreakBadge';
import QuickPingButton from '../components/QuickPingButton';

export default function Home() {
  const { pings, user } = useApp();
  const [filter, setFilter] = useState<'all' | 'pulse'>('all');

  const filtered = filter === 'pulse' ? pings.filter(p => p.isPulse) : pings;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0 12px',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,15,20,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 800,
            background: 'var(--pulse-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Pingd
          </h1>
        </div>
        <StreakBadge streak={user.pingStreak} />
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
      }}>
        {(['all', 'pulse'] as const).map(f => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 600,
              background: filter === f ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'var(--transition)',
            }}
          >
            {f === 'all' ? 'For You' : '⚡ Pulse'}
          </motion.button>
        ))}
      </div>

      <div>
        {filtered.map((ping, i) => (
          <PingCard key={ping.id} ping={ping} index={i} />
        ))}
      </div>

      <QuickPingButton />
    </div>
  );
}
