import { useState } from 'react';
import LiveChart from './LiveChart';
import { motion } from 'framer-motion';
import { Activity, Shield, Users, BarChart3 } from 'lucide-react';

export default function ResultsPage({ elections = [], hasLoaded, selectedElectionId, setSelectedElectionId }) {
  const [activeElecId, setActiveElecId] = useState(
    selectedElectionId || (elections.length > 0 ? elections[0].id : null)
  );

  const currentElection = elections.find(e => e.id === (activeElecId || selectedElectionId)) || elections[0];
  const candidates = currentElection?.candidates || [];
  const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <section>
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-4 border border-purple-500/30">
              <Activity className="h-4 w-4 animate-pulse" /> Live Consensus Engine
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              Real-time <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 glow-effect">War Room</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium">
              Watch consensus build live across networks on the decentralized ledger.
            </p>
          </motion.div>
        </div>

        {/* Election Selector Pills (if multiple elections exist) */}
        {elections.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Select Election:</span>
            {elections.map((elec) => {
              const isSelected = elec.id === (currentElection?.id);
              return (
                <button
                  key={elec.id}
                  onClick={() => {
                    setActiveElecId(elec.id);
                    if (setSelectedElectionId) setSelectedElectionId(elec.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg shadow-purple-500/20 scale-105'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>{elec.title}</span>
                  <span className="bg-slate-950/60 px-2 py-0.5 rounded-full text-[10px] text-slate-300 font-mono">
                    {elec.candidates?.reduce((acc, c) => acc + (c.voteCount || 0), 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Election Meta Stats */}
        {currentElection && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Active Election</p>
                <p className="font-bold text-white truncate max-w-[200px]">{currentElection.title}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Votes Cast</p>
                <p className="font-bold text-white text-lg font-mono">{totalVotes.toLocaleString()}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Network Scope</p>
                <p className="font-bold text-white truncate max-w-[200px]">
                  {currentElection.networkLabel || (currentElection.networkType === 'ALL' ? 'All Networks' : 'Restricted')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Live Chart or Loading / Empty States */}
        {!hasLoaded ? (
          <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-1/4 mb-3"></div>
                <div className="h-12 bg-slate-800 rounded-2xl animate-pulse w-full"></div>
              </div>
            ))}
          </div>
        ) : !currentElection || candidates.length === 0 ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-16 text-center rounded-3xl">
            <h3 className="text-2xl font-bold text-white mb-2">No Candidates Active</h3>
            <p className="text-slate-400 text-base">This election currently has no registered candidates.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-700/60 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Consensus Standings</h3>
              <span className="text-xs text-slate-400 font-mono">
                Hover over bars to inspect demographic network breakdown
              </span>
            </div>
            <LiveChart candidates={candidates} />
          </motion.div>
        )}
      </section>
    </div>
  );
}
