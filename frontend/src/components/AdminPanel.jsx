import { useState, useEffect } from 'react';
import { KeyRound, Power, Download, RefreshCcw, UserPlus, Users } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminPanel({ addToast, candidates, hasLoaded }) {
  const [adminSecret, setAdminSecret] = useState(() => {
    return sessionStorage.getItem('adminSecret') || '';
  });
  const [isElectionOpen, setIsElectionOpen] = useState(false); // Optimistic or derived state
  const [ledger, setLedger] = useState([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateColor, setNewCandidateColor] = useState('#3b82f6');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('adminSecret', adminSecret);
    
    if (adminSecret) {
      const fetchStatus = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/status`, {
            method: 'GET',
            headers: { 'X-Admin-Secret': adminSecret }
          });
          if (response.ok) {
            const data = await response.json();
            setIsElectionOpen(data.isOpen);
          }
        } catch (error) {
          console.error('Error fetching election status:', error);
        }
      };
      fetchStatus();
    }
  }, [adminSecret]);

  const toggleElection = async (openStatus) => {
    if (!adminSecret) {
      addToast('Please enter the Admin Secret Key first.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/status?open=${openStatus}`, {
        method: 'POST',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      });

      if (response.ok) {
        setIsElectionOpen(openStatus);
        addToast(`Election successfully ${openStatus ? 'opened' : 'closed'}.`, 'success');
      } else {
        const errText = await response.text();
        addToast(`Failed to update election status: ${errText || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error toggling election:', error);
      addToast('Network error while communicating with admin API.', 'error');
    }
  };

  const fetchLedger = async () => {
    if (!adminSecret) {
      addToast('Please enter the Admin Secret Key to view insights.', 'error');
      return;
    }

    setIsLoadingLedger(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/insights/raw-ledger`, {
        method: 'GET',
        headers: {
          'X-Admin-Secret': adminSecret
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLedger(data);
        addToast('Ledger data refreshed.', 'info');
      } else {
        const errText = await response.text();
        addToast(`Failed to fetch ledger: ${errText || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      addToast('Network error while fetching ledger.', 'error');
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!adminSecret) {
      addToast('Please enter the Admin Secret Key first.', 'error');
      return;
    }
    if (!newCandidateName.trim()) {
      addToast('Candidate name is required.', 'error');
      return;
    }

    setIsAddingCandidate(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          name: newCandidateName,
          partyColor: newCandidateColor
        })
      });

      if (response.ok) {
        addToast(`Candidate ${newCandidateName} added successfully.`, 'success');
        setNewCandidateName('');
        setNewCandidateColor('#3b82f6');
      } else {
        const errText = await response.text();
        addToast(`Failed to add candidate: ${errText || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      addToast('Network error while adding candidate.', 'error');
    } finally {
      setIsAddingCandidate(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6 flex items-center">
          <KeyRound className="h-6 w-6 mr-3 text-slate-400" />
          Authentication
        </h2>
        
        <div className="max-w-md">
          <label htmlFor="adminSecret" className="block text-sm font-medium text-slate-700 mb-2">
            Admin Secret Key
          </label>
          <input
            type="password"
            id="adminSecret"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter secret key..."
          />
        </div>
      </div>

      {/* Add Candidate Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 flex items-center">
          <UserPlus className="h-6 w-6 mr-3 text-slate-400" />
          Create New Candidate
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          Add a new candidate to the election. This will automatically update the public dashboard in real-time.
        </p>

        <form onSubmit={handleAddCandidate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="candidateName" className="block text-sm font-medium text-slate-700 mb-2">
              Candidate Name
            </label>
            <input
              type="text"
              id="candidateName"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Diana Prince"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="partyColor" className="block text-sm font-medium text-slate-700 mb-2">
              Party Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="partyColor"
                value={newCandidateColor}
                onChange={(e) => setNewCandidateColor(e.target.value)}
                className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0"
              />
              <input 
                type="text" 
                value={newCandidateColor}
                onChange={(e) => setNewCandidateColor(e.target.value)}
                className="w-28 px-3 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAddingCandidate}
            className="w-full sm:w-auto mt-4 sm:mt-0 py-3 px-8 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center h-[50px]"
          >
            {isAddingCandidate ? 'Adding...' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Current Candidates List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:px-8 md:pt-8 md:pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
             <Users className="h-6 w-6 mr-3 text-slate-400" />
             Current Candidates
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            {candidates?.length || 0} Candidates
          </span>
        </div>
        
        <div className="p-6 md:p-8">
          {!hasLoaded ? (
            <div className="text-center text-slate-400 py-4">Loading candidates...</div>
          ) : !candidates || candidates.length === 0 ? (
            <div className="text-center text-slate-400 py-4">No candidates created yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center p-4 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2" 
                    style={{ backgroundColor: c.partyColor || '#cbd5e1' }}
                  ></div>
                  <div className="flex-1 pl-4">
                     <p className="font-bold text-slate-800">{c.name}</p>
                     <p className="text-xs font-mono text-slate-500">{c.id}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Votes</p>
                     <p className="font-bold text-slate-900 text-lg">{c.voteCount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Election Control */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 flex items-center">
            <Power className="h-6 w-6 mr-3 text-slate-400" />
            Election Control
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            Open or close the election to control whether voters can submit their ballots.
          </p>
          
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-sm font-medium text-slate-500">Current Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isElectionOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isElectionOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          <div className="flex flex-col space-y-4">
             <button
                onClick={() => toggleElection(true)}
                className="w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
              >
                Open Election
              </button>
              <button
                onClick={() => toggleElection(false)}
                className="w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Close Election
              </button>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
           <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 flex items-center">
            <Download className="h-6 w-6 mr-3 text-slate-400" />
            Data Insights
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            Fetch the raw voting ledger for auditing and verification purposes.
          </p>

          <button
            onClick={fetchLedger}
            disabled={isLoadingLedger}
            className="w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            {isLoadingLedger ? (
              <RefreshCcw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="h-5 w-5 mr-2" />
            )}
            Refresh Ledger Data
          </button>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:px-8 md:pt-8 md:pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Raw Voting Ledger</h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            {ledger.length} Records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="py-4 px-6 font-semibold text-sm text-slate-500 border-b border-slate-200 uppercase tracking-wider">Vote ID</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-500 border-b border-slate-200 uppercase tracking-wider">Timestamp</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-500 border-b border-slate-200 uppercase tracking-wider">Candidate ID</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-500 border-b border-slate-200 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400">
                    No ledger records to display. Click refresh to fetch data.
                  </td>
                </tr>
              ) : (
                ledger.map((record, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-mono text-slate-600">{record.voteId || record.id}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-blue-600">{record.candidateId}</td>
                    <td className="py-4 px-6 text-sm font-mono text-slate-500">{record.ipAddress || 'Unknown'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
