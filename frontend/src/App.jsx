import { useState, useEffect, useRef, useCallback } from 'react';
import NavBar from './components/NavBar';
import VotePage from './components/VotePage';
import ResultsPage from './components/ResultsPage';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import { API_BASE_URL, WS_BASE_URL } from './config';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [currentView, setCurrentView] = useState('vote'); // 'vote', 'results', 'admin'
  const [toasts, setToasts] = useState([]);
  
  // Elections & Network State
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [detectedIp, setDetectedIp] = useState('127.0.0.1');
  const [networkGroup, setNetworkGroup] = useState('Localhost / Direct');
  const [testIpOverride, setTestIpOverride] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  
  // Track votes by electionId in local state
  const [myVotes, setMyVotes] = useState(() => {
    try {
      const saved = localStorage.getItem('electionSync_myVotes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const wsRef = useRef(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Sync myVotes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('electionSync_myVotes', JSON.stringify(myVotes));
    } catch (e) {
      console.error(e);
    }
  }, [myVotes]);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const loadElections = async () => {
      try {
        const url = testIpOverride 
          ? `${API_BASE_URL}/elections?clientIp=${encodeURIComponent(testIpOverride)}`
          : `${API_BASE_URL}/elections`;

        const res = await fetch(url);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setElections(data.elections || []);
          if (data.clientIp) setDetectedIp(data.clientIp);
          if (data.networkGroup) setNetworkGroup(data.networkGroup);
          setHasLoaded(true);
        }
      } catch (err) {
        console.warn('REST election fetch failed (will rely on WebSocket):', err);
      }
    };

    loadElections();
    return () => { isCancelled = true; };
  }, [testIpOverride, refreshKey]);

  // WebSocket Connection
  useEffect(() => {
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      setWsStatus('connecting');
      try {
        const ws = new WebSocket(`${WS_BASE_URL}/election`);

        ws.onopen = () => {
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'LIVE_UPDATE' || data.type === 'INITIAL_DATA') {
              if (data.elections && !testIpOverride) {
                setElections(data.elections);
              }
              if (data.clientIp && !testIpOverride) {
                setDetectedIp(data.clientIp);
              }
              if (data.networkGroup && !testIpOverride) {
                setNetworkGroup(data.networkGroup);
              }
              setHasLoaded(true);
            } else if (data.type === 'ERROR') {
              addToast(data.message, 'error');
            } else if (data.type === 'INFO') {
              addToast(data.message, 'info');
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message', err);
          }
        };

        ws.onclose = () => {
          setWsStatus('error');
          wsRef.current = null;
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.error('WebSocket Error', err);
          ws.close();
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('WebSocket connection error:', err);
        setWsStatus('error');
        reconnectTimeout = setTimeout(connectWebSocket, 4000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addToast, testIpOverride]);

  // Vote Casting
  const castVote = async (electionId, candidateId) => {
    // Optimistically record vote
    setMyVotes(prev => ({ ...prev, [electionId]: candidateId }));

    // Try WebSocket if connected and no test IP simulation
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !testIpOverride) {
      wsRef.current.send(JSON.stringify({
        type: 'CAST_VOTE',
        electionId,
        candidateId
      }));
      addToast('Vote transmitted to blockchain ledger.', 'success');
      return;
    }

    // Otherwise use REST API fallback (also handles simulated testIpOverride!)
    try {
      const res = await fetch(`${API_BASE_URL}/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          clientIp: testIpOverride || detectedIp
        })
      });

      if (res.ok) {
        addToast('Vote registered successfully!', 'success');
        setRefreshKey(k => k + 1);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.message || 'Failed to submit vote.', 'error');
      }
    } catch (err) {
      console.error('Vote submission error', err);
      addToast('Network error while casting vote.', 'error');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-brand-500 selection:text-white">
      <NavBar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        wsStatus={wsStatus}
        detectedIp={testIpOverride ? `${testIpOverride} (Simulated)` : detectedIp}
        networkGroup={networkGroup}
        testIpOverride={testIpOverride}
        setTestIpOverride={setTestIpOverride}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {currentView === 'vote' && (
            <motion.div key="vote" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
              <VotePage 
                elections={elections}
                selectedElectionId={selectedElectionId}
                setSelectedElectionId={setSelectedElectionId}
                hasLoaded={hasLoaded} 
                castVote={castVote}
                detectedIp={testIpOverride ? `${testIpOverride} (Simulated)` : detectedIp}
                networkGroup={networkGroup}
                myVotes={myVotes}
              />
            </motion.div>
          )}

          {currentView === 'results' && (
            <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
              <ResultsPage 
                elections={elections} 
                selectedElectionId={selectedElectionId}
                setSelectedElectionId={setSelectedElectionId}
                hasLoaded={hasLoaded} 
              />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
              <AdminPanel addToast={addToast} hasLoaded={hasLoaded} />
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
