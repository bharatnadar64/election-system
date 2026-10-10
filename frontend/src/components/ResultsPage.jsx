import LiveChart from './LiveChart';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function ResultsPage({ candidates, hasLoaded }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <section>
        <div className="mb-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold tracking-widest uppercase mb-4 border border-purple-500/30 flex items-center justify-center w-max mx-auto">
              <Activity className="h-4 w-4 mr-2 animate-pulse" /> Live Leaderboard
            </span>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
              Real-time <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 glow-effect">War Room</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Watch the global consensus form instantly on the immutable ledger.
            </p>
          </motion.div>
        </div>
        
        {!hasLoaded ? (
           <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col space-y-6">
             {[1, 2, 3].map((i) => (
               <div key={i} className="w-full">
                 <div className="h-4 bg-slate-700 rounded animate-pulse w-1/4 mb-3"></div>
                 <div className="h-12 bg-slate-800 rounded-2xl animate-pulse w-full"></div>
               </div>
             ))}
           </div>
        ) : candidates.length === 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-16 text-center rounded-3xl">
            <h3 className="text-3xl font-black text-white mb-4">No Data</h3>
            <p className="text-slate-400 text-lg">The blockchain is quiet. No candidates are active yet.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-700/50"
          >
            <LiveChart candidates={candidates} />
          </motion.div>
        )}
      </section>
    </div>
  );
}
