import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Conversation } from '../types';
import Avatar from '../components/Avatar';
import { useTimeAgo } from '../hooks/useTimeAgo';

function ConversationPreview({ conv, onClick }: { conv: Conversation; onClick: () => void }) {
  const timeAgo = useTimeAgo(conv.lastMessageTime);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        cursor: 'pointer',
        borderRadius: 'var(--card-radius)',
        background: conv.unreadCount > 0 ? 'rgba(108,92,231,0.05)' : 'transparent',
        marginBottom: 4,
      }}
    >
      <Avatar src={conv.user.avatar} size={48} hasStory={conv.unreadCount > 0} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{conv.user.displayName}</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo}</span>
        </div>
        <p style={{
          fontSize: 13,
          color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: conv.unreadCount > 0 ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: 2,
        }}>
          {conv.lastMessage}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <div style={{
          background: 'var(--accent)',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
        }}>
          {conv.unreadCount}
        </div>
      )}
    </motion.div>
  );
}

function ChatView({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const { sendMessage, user } = useApp();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(conv.id, text.trim());
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-height))' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,20,0.95)',
        backdropFilter: 'blur(20px)',
      }}>
        <button onClick={onBack}>
          <ArrowLeft size={22} color="var(--text-primary)" />
        </button>
        <Avatar src={conv.user.avatar} size={36} />
        <div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{conv.user.displayName}</span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{conv.user.username}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {conv.messages.map(msg => {
          const isMine = msg.senderId === user.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMine ? 'var(--accent)' : 'var(--bg-secondary)',
                color: isMine ? 'white' : 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 14,
            border: '1px solid var(--border)',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: text.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={18} color={text.trim() ? 'white' : 'var(--text-tertiary)'} />
        </motion.button>
      </div>
    </div>
  );
}

export default function Messages() {
  const { conversations } = useApp();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const activeConv = activeConvId ? conversations.find(c => c.id === activeConvId) || null : null;

  return (
    <div style={{ paddingBottom: activeConv ? 0 : 80 }}>
      <AnimatePresence mode="wait">
        {activeConv ? (
          <motion.div
            key="chat"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <ChatView conv={activeConv} onBack={() => setActiveConvId(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{
              padding: '16px 16px 12px',
              position: 'sticky',
              top: 0,
              background: 'rgba(15,15,20,0.95)',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
            }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Messages</h1>
            </div>
            <div style={{ padding: '0 8px' }}>
              {conversations.map(conv => (
                <ConversationPreview
                  key={conv.id}
                  conv={conv}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
