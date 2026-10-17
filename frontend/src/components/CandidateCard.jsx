import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

export default function CandidateCard({ candidate, onVote, isVoted = false, isDisabled = false }) {
  const handleVoteClick = (e) => {
    if (isDisabled) return;

    // Fire celebratory confetti from the click location
    const rect = e.target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: [candidate.partyColor || '#3b82f6', '#ffffff', '#ffcc00', '#a855f7']
    });
    
    onVote();
  };

  return (
    <motion.div 
      whileHover={isDisabled ? {} : { scale: 1.03, y: -4 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full group border transition-all ${
        isVoted 
          ? 'border-brand-500 ring-2 ring-brand-500/50 shadow-2xl' 
          : 'border-slate-700/60 hover:border-slate-500/50'
      }`}
      style={{
        boxShadow: isVoted 
          ? `0 15px 35px -10px ${candidate.partyColor || '#6366f1'}70`
          : `0 10px 30px -10px ${candidate.partyColor || '#3b82f6'}30`
      }}
    >
      {/* Background Accent Glow */}
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" 
        style={{ backgroundColor: candidate.partyColor || '#cbd5e1' }}
      ></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "anticipate" }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg"
              style={{ 
                backgroundColor: candidate.partyColor || '#94a3b8',
                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0) 100%)`
              }}
            >
              {candidate.name.charAt(0)}
            </motion.div>
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{candidate.name}</h3>
              <p className="text-xs font-medium text-slate-400 font-mono mt-0.5">ID: {candidate.id}</p>
            </div>
          </div>

          {isVoted && (
            <span className="bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Check className="h-3.5 w-3.5" /> Your Vote
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <button
          onClick={handleVoteClick}
          disabled={isDisabled}
          className={`relative w-full py-4 px-4 rounded-xl font-black text-white uppercase tracking-wider text-sm transition-all overflow-hidden flex items-center justify-center gap-2 ${
            isDisabled 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700' 
              : 'shadow-lg hover:shadow-xl active:scale-98'
          }`}
          style={!isDisabled ? { 
            backgroundColor: candidate.partyColor || '#3b82f6',
            boxShadow: `0 8px 24px -6px ${candidate.partyColor || '#3b82f6'}80`
          } : {}}
        >
          {isVoted ? (
            <>
              <Check className="h-4 w-4" />
              <span>Current Choice (Click to Reconfirm)</span>
            </>
          ) : isDisabled ? (
            <span>Voting Closed</span>
          ) : (
            <span>Cast Vote for {candidate.name.split(' ')[0]}</span>
          )}
          
          {!isDisabled && (
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-15 transition-opacity duration-300"></div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
