import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { sampleUsers, categories } from '../data/sampleData';
import PingCard from '../components/PingCard';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const { pings } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'users' | 'categories'>('trending');

  const trending = [...pings].sort((a, b) => (b.likes + b.reposts) - (a.likes + a.reposts)).slice(0, 5);
  const suggestedUsers = sampleUsers.slice(1, 6);

  const filteredPings = search
    ? pings.filter(p => p.text.toLowerCase().includes(search.toLowerCase()))
    : trending;

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
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Explore</h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          padding: '10px 16px',
          border: '1px solid var(--border)',
        }}>
          <Search size={18} color="var(--text-tertiary)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pings, users, topics..."
            style={{
              flex: 1,
              fontSize: 15,
              background: 'transparent',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px', overflowX: 'auto' }}>
        {(['trending', 'users', 'categories'] as const).map(tab => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'var(--border)'}`,
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {activeTab === 'trending' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={18} color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Trending Now</span>
          </div>
          {filteredPings.map((ping, i) => (
            <PingCard key={ping.id} ping={ping} index={i} />
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Suggested For You</h3>
          {suggestedUsers.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/profile/${u.username}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--card-radius)',
                marginBottom: 8,
                cursor: 'pointer',
                border: '1px solid var(--border)',
              }}
            >
              <Avatar src={u.avatar} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{u.displayName}</span>
                  {u.isVerified && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{u.username}</span>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{u.bio}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Follow
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--card-radius)',
                padding: 16,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                {(cat.pingCount / 1000).toFixed(1)}K pings
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
