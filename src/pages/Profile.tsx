import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Calendar, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sampleUsers } from '../data/sampleData';
import PingCard from '../components/PingCard';
import Avatar from '../components/Avatar';
import StreakBadge from '../components/StreakBadge';
import { formatCount } from '../hooks/useTimeAgo';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, setUser, pings } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const isOwnRoute = !username || username === currentUser.username;
  const foundUser = !isOwnRoute ? sampleUsers.find(u => u.username === username) : undefined;
  const isOwn = isOwnRoute || !foundUser;
  const profileUser = isOwn ? currentUser : foundUser;
  const userPings = pings.filter(p => p.userId === profileUser.id);

  const startEdit = () => {
    setEditName(currentUser.displayName);
    setEditBio(currentUser.bio);
    setIsEditing(true);
  };

  const saveEdit = () => {
    setUser({
      ...currentUser,
      displayName: editName,
      bio: editBio,
    });
    setIsEditing(false);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        height: 150,
        background: `url(${profileUser.banner}) center/cover`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(transparent 40%, var(--bg-primary))',
        }} />
      </div>

      <div style={{ padding: '0 16px', marginTop: -40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Avatar src={profileUser.avatar} size={80} hasStory style={{
            border: '4px solid var(--bg-primary)',
          }} />
          {isOwn && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startEdit}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-secondary)',
              }}
            >
              <Settings size={14} /> Edit Profile
            </motion.button>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profileUser.displayName}</h2>
            {profileUser.isVerified && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            <StreakBadge streak={profileUser.pingStreak} size="sm" />
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>@{profileUser.username}</span>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.5, marginTop: 10 }}>{profileUser.bio}</p>

        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
            <Calendar size={14} /> Joined {new Date(profileUser.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{formatCount(profileUser.following)}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 4 }}>Following</span>
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{formatCount(profileUser.followers)}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 4 }}>Followers</span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {isOwn ? 'Your Pings' : `${profileUser.displayName}'s Pings`}
          </h3>
          {userPings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-tertiary)',
            }}>
              <p>No pings yet</p>
            </div>
          ) : (
            userPings.map((ping, i) => (
              <PingCard key={ping.id} ping={ping} index={i} />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--card-radius)',
                padding: 20,
                width: '100%',
                maxWidth: 400,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => setIsEditing(false)}>
                  <X size={20} color="var(--text-secondary)" />
                </button>
                <h3 style={{ fontWeight: 600, fontSize: 16 }}>Edit Profile</h3>
                <motion.button whileTap={{ scale: 0.95 }} onClick={saveEdit}>
                  <Check size={20} color="var(--accent)" />
                </motion.button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Display Name
                </label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  maxLength={160}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 15,
                    minHeight: 80,
                    resize: 'none',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
