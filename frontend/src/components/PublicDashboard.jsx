import { useState, useEffect, useRef } from 'react';
import CandidateCard from './CandidateCard';
import LiveChart from './LiveChart';
import { WS_BASE_URL } from '../config';

export default function PublicDashboard({ addToast, setWsStatus }) {
  const [candidates, setCandidates] = useState([]);
  const wsRef = useRef(null);

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
          
          if (data.type === 'LIVE_UPDATE') {
            setCandidates(data.candidates);
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
  }, [addToast, setWsStatus]);

  const castVote = (candidateId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CAST_VOTE',
        candidateId
      }));
      // We don't optimistically update here; we wait for the server's LIVE_UPDATE.
      addToast('Vote submitted...', 'info');
    } else {
      addToast('Connection lost. Please wait to reconnect before voting.', 'error');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Voting Booth</h1>
          <p className="text-slate-500 mt-1">Select your preferred candidate to cast your vote.</p>
        </div>
        
        {candidates.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Skeleton Loaders */}
             {[1, 2, 3].map(i => (
               <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onVote={() => castVote(candidate.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="w-full h-px bg-slate-200"></div>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Live Results</h2>
          <p className="text-slate-500 mt-1">Real-time vote counting and demographic breakdown.</p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <LiveChart candidates={candidates} />
        </div>
      </section>

    </div>
  );
}
