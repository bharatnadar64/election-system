import { useState, useCallback } from 'react';
import NavBar from './components/NavBar';
import PublicDashboard from './components/PublicDashboard';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'connected', 'error'

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <NavBar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        wsStatus={wsStatus} 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'dashboard' ? (
          <PublicDashboard addToast={addToast} setWsStatus={setWsStatus} />
        ) : (
          <AdminPanel addToast={addToast} />
        )}
      </main>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
}

export default App;
