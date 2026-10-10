import { useState, useEffect, useRef, useCallback } from 'react';
import NavBar from './components/NavBar';
import VotePage from './components/VotePage';
import ResultsPage from './components/ResultsPage';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { WS_BASE_URL } from './config';

import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [currentView, setCurrentView] = useState('vote'); // 'vote', 'results', 'admin'
  const [toasts, setToasts] = useState([]);
  
  // Global Election State
  const [candidates, setCandidates] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const wsRef = useRef(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      setWsStatus('connecting');
      const ws = new WebSocket(`${WS_BASE_URL}/election`);

      ws.onopen = () => {
        setWsStatus('connected');
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'LIVE_UPDATE' || data.type === 'INITIAL_DATA') {
            setCandidates(data.candidates);
            setHasLoaded(true);
          } else if (data.type === 'ERROR') {
            addToast(data.message, 'error');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      ws.onclose = () => {
        setWsStatus('error');
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        wsRef.current = null;
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error', err);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addToast]);

  const castVote = (candidateId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CAST_VOTE',
        candidateId
      }));
    } else {
      addToast('Connection lost. Please wait to reconnect before voting.', 'error');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-brand-500 selection:text-white">
      <NavBar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        wsStatus={wsStatus} 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {currentView === 'vote' && (
            <motion.div key="vote" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <VotePage candidates={candidates} hasLoaded={hasLoaded} castVote={castVote} />
            </motion.div>
          )}
          {currentView === 'results' && (
            <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <ResultsPage candidates={candidates} hasLoaded={hasLoaded} />
            </motion.div>
          )}
          {currentView === 'admin' && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <AdminPanel addToast={addToast} candidates={candidates} hasLoaded={hasLoaded} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Toast message={toast.message} type={toast.type} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
