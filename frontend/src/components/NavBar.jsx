import { Activity, Shield, Vote, Wifi, WifiOff } from 'lucide-react';

export default function NavBar({ currentView, setCurrentView, wsStatus }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Vote className="h-8 w-8 text-blue-600 mr-2" />
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Election<span className="text-blue-600">Sync</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg mr-4">
              <button
                onClick={() => setCurrentView('vote')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentView === 'vote'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Vote className="h-4 w-4 mr-2" />
                Vote
              </button>
              <button
                onClick={() => setCurrentView('results')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentView === 'results'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Results
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currentView === 'admin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </button>
            </div>

            {(currentView === 'vote' || currentView === 'results') && (
              <div
                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  wsStatus === 'connected'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : wsStatus === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {wsStatus === 'connected' ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : wsStatus === 'error' ? (
                  <WifiOff className="h-3 w-3 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                )}
                <span className="capitalize">{wsStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
