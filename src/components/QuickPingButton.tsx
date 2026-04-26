import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function QuickPingButton() {
  const { setQuickPingOpen } = useApp();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setQuickPingOpen(true)}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'var(--pulse-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px var(--accent-glow)',
        zIndex: 90,
        border: 'none',
      }}
    >
      <Zap size={22} fill="white" color="white" />
    </motion.button>
  );
}
