import { Activity, Shield, Vote, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NavBar({ currentView, setCurrentView, wsStatus }) {
  const tabs = [
    { id: 'vote', label: 'Vote', icon: Vote },
    { id: 'results', label: 'Live Results', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Shield }
  ];

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b-0 border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-20 py-4 sm:py-0">
          <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0">
            <motion.div 
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Vote className="h-8 w-8 text-brand-400 mr-3" />
            </motion.div>
            <span className="font-bold text-2xl tracking-tight text-white glow-effect rounded-full px-2">
              Election<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Sync</span>
            </span>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50 relative">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    className={`relative flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all z-10 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl shadow-lg glow-effect"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {(currentView === 'vote' || currentView === 'results') && (
              <div
                className={`hidden md:flex items-center px-4 py-2 rounded-full text-xs font-bold border shadow-lg ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : wsStatus === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {wsStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 mr-2" />
                ) : wsStatus === 'error' ? (
                  <WifiOff className="h-4 w-4 mr-2" />
                ) : (
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                )}
                <span className="uppercase tracking-widest">{wsStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
