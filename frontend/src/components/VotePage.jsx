import CandidateCard from './CandidateCard';
import { motion } from 'framer-motion';

export default function VotePage({ candidates, hasLoaded, castVote }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <section>
        <div className="mb-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-brand-500/20 text-brand-400 text-sm font-bold tracking-widest uppercase mb-4 border border-brand-500/30">
              Live Polling
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
              Cast Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 glow-effect">Power Vote</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Every single vote sends shockwaves through the blockchain ledger. Choose your champion.
            </p>
          </motion.div>
        </div>
        
        {!hasLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-64 glass-panel rounded-3xl animate-pulse"></div>
             ))}
          </div>
        ) : candidates.length === 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-16 text-center rounded-3xl">
            <h3 className="text-3xl font-black text-white mb-4">Awaiting Champions</h3>
            <p className="text-slate-400 text-lg">The election arena is currently empty. Candidates will appear here when registered.</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {candidates.map((candidate) => (
              <motion.div key={candidate.id} variants={itemVariants}>
                <CandidateCard
                  candidate={candidate}
                  onVote={() => castVote(candidate.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
