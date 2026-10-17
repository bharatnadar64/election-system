import { Activity, Shield, Vote, Wifi, WifiOff, Globe, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NavBar({ 
  currentView, 
  setCurrentView, 
  wsStatus, 
  detectedIp, 
  networkGroup,
  testIpOverride,
  setTestIpOverride,
  isSimulating,
  setIsSimulating
}) {
  const tabs = [
    { id: 'vote', label: 'Vote Arena', icon: Vote },
    { id: 'results', label: 'Live Results', icon: Activity },
    { id: 'admin', label: 'Admin Hub', icon: Shield }
  ];

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-20 py-3 md:py-0 gap-3">
          
          {/* Logo & Network Identity */}
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <div 
              onClick={() => setCurrentView('vote')}
              className="flex items-center cursor-pointer group"
            >
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20 mr-3"
              >
                <Vote className="h-6 w-6 text-white" />
              </motion.div>
              <span className="font-extrabold text-2xl tracking-tight text-white glow-effect">
                Election<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Sync</span>
              </span>
            </div>

            {/* Network / Detected IP Badge */}
            {detectedIp && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono text-slate-300 font-semibold">{detectedIp}</span>
                <span className="text-slate-500">•</span>
                <span className="text-brand-300 font-medium truncate max-w-[150px]">{networkGroup || 'Network Detected'}</span>
                
                {/* IP Simulation Toggle button */}
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  title="Test / simulate different IP address"
                  className={`ml-1 p-1 rounded-md transition-colors ${
                    testIpOverride ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Controls & Status */}
          <div className="flex items-center justify-center space-x-3 flex-wrap">
            <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 relative shadow-inner">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    className={`relative flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all z-10 ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl shadow-lg glow-effect"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* WebSocket connection status */}
            <div
              className={`hidden lg:flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : wsStatus === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {wsStatus === 'connected' ? (
                <Wifi className="h-3.5 w-3.5 mr-1.5" />
              ) : wsStatus === 'error' ? (
                <WifiOff className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Activity className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              <span className="uppercase tracking-widest text-[10px]">{wsStatus}</span>
            </div>
          </div>
        </div>

        {/* IP Simulation Banner (Collapsible) */}
        {isSimulating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-3 pt-1 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300 gap-4 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-400 flex items-center">
                <Sliders className="h-3.5 w-3.5 mr-1" /> IP Simulator Mode:
              </span>
              <span className="text-slate-400">Test how the election interface appears from different networks/IPs.</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.50 or 10.0.0.1"
                value={testIpOverride}
                onChange={(e) => setTestIpOverride(e.target.value)}
                className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={() => setTestIpOverride('127.0.0.1')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md text-[11px]"
              >
                127.0.0.1
              </button>
              <button
                onClick={() => setTestIpOverride('192.168.1.100')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md text-[11px]"
              >
                192.168.1.100
              </button>
              <button
                onClick={() => setTestIpOverride('10.0.0.15')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md text-[11px]"
              >
                10.0.0.15
              </button>
              {testIpOverride && (
                <button
                  onClick={() => setTestIpOverride('')}
                  className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2 py-1 rounded-md text-[11px]"
                >
                  Reset
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
