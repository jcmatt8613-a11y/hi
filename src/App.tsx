import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import CreatePingModal from './components/CreatePingModal';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          minHeight: '100vh',
          position: 'relative',
          background: 'var(--bg-primary)',
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
          </Routes>
          <CreatePingModal />
          <BottomNav />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
