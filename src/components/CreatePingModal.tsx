import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';

export default function CreatePingModal() {
  const { user, addPing, isCreateOpen, setCreateOpen, isQuickPingOpen, setQuickPingOpen } = useApp();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 250;

  const isOpen = isCreateOpen || isQuickPingOpen;

  const handleClose = () => {
    setCreateOpen(false);
    setQuickPingOpen(false);
    setText('');
    setImagePreview(null);
  };

  const handlePost = () => {
    if (!text.trim()) return;
    addPing(text.trim(), imagePreview || undefined);
    handleClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const charsLeft = maxChars - text.length;
  const isOverLimit = charsLeft < 0;

  return (
    <AnimatePresence>
      {isOpen && (
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
            alignItems: isQuickPingOpen ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isQuickPingOpen ? 0 : 16,
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={isQuickPingOpen ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
            animate={isQuickPingOpen ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isQuickPingOpen ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: isQuickPingOpen ? '20px 20px 0 0' : 'var(--card-radius)',
              width: '100%',
              maxWidth: 'var(--max-width)',
              padding: isQuickPingOpen ? '16px 16px 80px' : 20,
              maxHeight: isQuickPingOpen ? '40vh' : '80vh',
              overflow: 'auto',
            }}
          >
            {!isQuickPingOpen && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <button onClick={handleClose}>
                  <X size={22} color="var(--text-secondary)" />
                </button>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Create Ping</h3>
                <div style={{ width: 22 }} />
              </div>
            )}

            {isQuickPingOpen && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <Zap size={16} fill="var(--accent)" color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                  Quick Ping
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {!isQuickPingOpen && <Avatar src={user.avatar} size={40} />}
              <div style={{ flex: 1 }}>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={isQuickPingOpen ? "Quick ping..." : "What's on your mind?"}
                  autoFocus
                  maxLength={maxChars + 10}
                  style={{
                    width: '100%',
                    minHeight: isQuickPingOpen ? 60 : 120,
                    resize: 'none',
                    fontSize: 16,
                    lineHeight: 1.5,
                    background: 'transparent',
                    color: 'var(--text-primary)',
                  }}
                />

                {imagePreview && (
                  <div style={{ position: 'relative', marginTop: 12 }}>
                    <img
                      src={imagePreview}
                      alt=""
                      style={{
                        borderRadius: 'var(--radius-md)',
                        maxHeight: 200,
                        width: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} color="white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isQuickPingOpen && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageUpload}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image size={18} color="var(--accent)" />
                    </button>
                  </>
                )}
                <span style={{
                  fontSize: 13,
                  color: isOverLimit ? 'var(--danger)' : charsLeft <= 20 ? 'var(--warning)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {charsLeft}
                </span>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePost}
                disabled={!text.trim() || isOverLimit}
                style={{
                  background: text.trim() && !isOverLimit ? 'var(--pulse-gradient)' : 'var(--bg-tertiary)',
                  color: text.trim() && !isOverLimit ? 'white' : 'var(--text-tertiary)',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: text.trim() && !isOverLimit ? 'pointer' : 'default',
                }}
              >
                {isQuickPingOpen ? '⚡ Ping' : 'Post'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
