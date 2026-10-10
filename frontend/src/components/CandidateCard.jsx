import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function CandidateCard({ candidate, onVote }) {
  const handleVoteClick = (e) => {
    // Fire confetti from the click location
    const rect = e.target.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: [candidate.partyColor || '#3b82f6', '#ffffff', '#ffcc00']
    });
    
    onVote();
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotateY: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full group"
      style={{
        boxShadow: `0 10px 30px -10px ${candidate.partyColor}40`
      }}
    >
      {/* Background Accent Glow */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
        style={{ backgroundColor: candidate.partyColor || '#cbd5e1' }}
      ></div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "anticipate" }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg"
            style={{ 
              backgroundColor: candidate.partyColor || '#94a3b8',
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 100%)`
            }}
          >
            {candidate.name.charAt(0)}
          </motion.div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{candidate.name}</h3>
            <p className="text-sm font-medium text-slate-400 font-mono mt-1">ID: {candidate.id}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleVoteClick}
        className="relative z-10 mt-6 w-full py-4 px-4 rounded-xl font-black text-white uppercase tracking-widest text-sm transition-all overflow-hidden group/btn"
        style={{ 
          backgroundColor: candidate.partyColor || '#3b82f6',
          boxShadow: `0 8px 20px -5px ${candidate.partyColor || '#3b82f6'}80`
        }}
      >
        <span className="relative z-10">Cast Vote for {candidate.name.split(' ')[0]}</span>
        <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
      </button>
    </motion.div>
  );
}
