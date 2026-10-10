import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveChart({ candidates }) {
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex flex-col space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full">
            <div className="h-4 bg-slate-700 rounded animate-pulse w-1/4 mb-3"></div>
            <div className="h-12 bg-slate-800 rounded-2xl animate-pulse w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1);
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {sortedCandidates.map((candidate, index) => {
          const percentage = Math.max((candidate.voteCount / maxVotes) * 100, 2);

          return (
            <motion.div 
              key={candidate.id} 
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative"
            >
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3">
                  {index === 0 && candidate.voteCount > 0 && (
                    <span className="text-2xl animate-bounce">👑</span>
                  )}
                  <span className="font-extrabold text-white text-xl tracking-tight">
                    {candidate.name}
                  </span>
                </div>
                <span className="font-black text-brand-400 text-2xl drop-shadow-md">
                  {candidate.voteCount.toLocaleString()}
                </span>
              </div>
              
              <div 
                className="h-12 w-full bg-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer border border-slate-700/50 shadow-inner"
                onMouseEnter={() => setHoveredCandidateId(candidate.id)}
                onMouseLeave={() => setHoveredCandidateId(null)}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="h-full rounded-2xl relative overflow-hidden"
                  style={{
                    backgroundColor: candidate.partyColor || '#3b82f6',
                  }}
                >
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                    backgroundSize: '20px 20px',
                    animation: 'move 1s linear infinite'
                  }}></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                </motion.div>
              </div>

              <AnimatePresence>
                {hoveredCandidateId === candidate.id && candidate.networkBreakdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-72 bg-slate-900/90 backdrop-blur-xl text-white text-sm rounded-2xl p-5 shadow-2xl border border-slate-700/50"
                  >
                    <div className="font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2 uppercase tracking-wider text-xs">
                      Demographic Breakdown
                    </div>
                    <div className="space-y-2">
                      {Object.entries(candidate.networkBreakdown).map(([network, count]) => (
                        <div key={network} className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">{network}</span>
                          <span className="font-mono bg-slate-800 px-2 py-1 rounded text-brand-300 font-bold">{count}</span>
                        </div>
                      ))}
                      {Object.keys(candidate.networkBreakdown).length === 0 && (
                        <div className="text-slate-500 italic text-center py-2">No demographic data available.</div>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[10px] border-transparent border-t-slate-900/90"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <style>{`
        @keyframes move {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
      `}</style>
    </div>
  );
}
