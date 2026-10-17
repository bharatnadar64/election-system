import { useState, useEffect, useCallback } from 'react';
import { 
  Power, Download, RefreshCcw, UserPlus, Users, 
  PlusCircle, Shield, Globe, Trash2, BarChart2, Layers, 
  Search
} from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminPanel({ addToast }) {
  const [adminSecret, setAdminSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Navigation sub-tabs inside Admin Hub
  const [activeTab, setActiveTab] = useState('elections'); // 'elections', 'analytics', 'members', 'ledger'

  // Elections state
  const [elections, setElections] = useState([]);
  const [isLoadingElections, setIsLoadingElections] = useState(false);
  const [selectedElectionForAnalytics, setSelectedElectionForAnalytics] = useState(null);

  // New Election Form state
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNetworkType, setNewNetworkType] = useState('ALL'); // 'ALL' or 'RESTRICTED'
  const [newAllowedIps, setNewAllowedIps] = useState('127.0.0.1, 192.168.1.*');
  const [newNetworkLabel, setNewNetworkLabel] = useState('');
  const [selectedExistingMemberIds, setSelectedExistingMemberIds] = useState([]);
  const [inlineNewMembers, setInlineNewMembers] = useState([]);
  const [inlineMemberName, setInlineMemberName] = useState('');
  const [inlineMemberColor, setInlineMemberColor] = useState('#6366f1');
  const [isSubmittingElection, setIsSubmittingElection] = useState(false);

  // Members directory state
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#3b82f6');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Network Vote Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [groupingMode, setGroupingMode] = useState('network'); // 'network', 'ip', 'candidate'
  const [analyticsSearch, setAnalyticsSearch] = useState('');

  // Raw Ledger state
  const [ledger, setLedger] = useState([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerElectionFilter, setLedgerElectionFilter] = useState('');

  // Quick add member to existing election modal state
  const [addCandElectionId, setAddCandElectionId] = useState(null);
  const [addCandMemberId, setAddCandMemberId] = useState('');
  const [addCandName, setAddCandName] = useState('');
  const [addCandColor, setAddCandColor] = useState('#10b981');
  const [isAddingCandToElec, setIsAddingCandToElec] = useState(false);

  const fetchElections = useCallback(async (secret = adminSecret) => {
    if (!secret) return;
    setIsLoadingElections(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/elections`, {
        headers: { 'X-Admin-Secret': secret }
      });
      if (res.ok) {
        const data = await res.json();
        setElections(data);
        if (data.length > 0) {
          setSelectedElectionForAnalytics(prev => prev || data[0].id);
        }
      }
    } catch {
      console.warn('Failed to load elections');
    } finally {
      setIsLoadingElections(false);
    }
  }, [adminSecret]);

  const fetchMembers = useCallback(async (secret = adminSecret) => {
    if (!secret) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/members`, {
        headers: { 'X-Admin-Secret': secret }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      console.warn('Failed to load members');
    }
  }, [adminSecret]);

  const handleLogin = useCallback(async (secretToUse, isAutoLogin = false) => {
    const secret = secretToUse || adminSecret;
    if (!secret) return;
    
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/status`, {
        method: 'GET',
        headers: { 'X-Admin-Secret': secret }
      });
      if (response.ok) {
        setIsLoggedIn(true);
        sessionStorage.setItem('adminSecret', secret);
        if (!isAutoLogin) addToast('Authenticated as Administrator.', 'success');
        
        fetchElections(secret);
        fetchMembers(secret);
      } else {
        setIsLoggedIn(false);
        sessionStorage.removeItem('adminSecret');
        if (!isAutoLogin) addToast('Invalid Admin Secret Key.', 'error');
      }
    } catch (error) {
      console.error('Error verifying key:', error);
      if (!isAutoLogin) addToast('Network error verifying admin key.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  }, [adminSecret, addToast, fetchElections, fetchMembers]);

  const fetchAnalytics = useCallback(async (electionId, secret = adminSecret) => {
    if (!electionId || !secret) return;
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/elections/${electionId}/insights/network-votes`, {
        headers: { 'X-Admin-Secret': secret }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      } else {
        addToast('Failed to fetch analytics for election.', 'error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      addToast('Network error fetching analytics.', 'error');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [adminSecret, addToast]);

  useEffect(() => {
    let isCancelled = false;
    const secret = sessionStorage.getItem('adminSecret');
    if (secret) {
      const verify = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/status`, {
            method: 'GET',
            headers: { 'X-Admin-Secret': secret }
          });
          if (res.ok && !isCancelled) {
            setIsLoggedIn(true);
            fetchElections(secret);
            fetchMembers(secret);
          }
        } catch {
          // ignore
        }
      };
      verify();
    }
    return () => { isCancelled = true; };
  }, [fetchElections, fetchMembers]);

  useEffect(() => {
    let isCancelled = false;
    if (!isLoggedIn || !selectedElectionForAnalytics || !adminSecret) return;

    const loadAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/elections/${selectedElectionForAnalytics}/insights/network-votes`, {
          headers: { 'X-Admin-Secret': adminSecret }
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        if (!isCancelled) setIsLoadingAnalytics(false);
      }
    };

    loadAnalytics();
    return () => { isCancelled = true; };
  }, [selectedElectionForAnalytics, isLoggedIn, adminSecret]);

  const toggleElectionStatus = async (electionId, newOpenStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/elections/${electionId}/status?open=${newOpenStatus}`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (res.ok) {
        addToast(`Election status updated to ${newOpenStatus ? 'OPEN' : 'CLOSED'}.`, 'success');
        fetchElections();
      } else {
        addToast('Failed to toggle status.', 'error');
      }
    } catch {
      addToast('Network error updating election status.', 'error');
    }
  };

  const handleDeleteElection = async (electionId, title) => {
    if (!window.confirm(`Are you sure you want to delete election "${title}"? All associated votes will be permanently removed.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/elections/${electionId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (res.ok) {
        addToast(`Election "${title}" deleted.`, 'info');
        fetchElections();
        if (selectedElectionForAnalytics === electionId) {
          setSelectedElectionForAnalytics(null);
          setAnalyticsData(null);
        }
      } else {
        addToast('Failed to delete election.', 'error');
      }
    } catch {
      addToast('Network error deleting election.', 'error');
    }
  };

  const handleAddInlineMember = (e) => {
    e.preventDefault();
    if (!inlineMemberName.trim()) return;
    setInlineNewMembers([
      ...inlineNewMembers,
      { name: inlineMemberName.trim(), partyColor: inlineMemberColor }
    ]);
    setInlineMemberName('');
    setInlineMemberColor('#10b981');
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('Election Title is required.', 'error');
      return;
    }

    const ipsList = newNetworkType === 'RESTRICTED'
      ? newAllowedIps.split(',').map(s => s.trim()).filter(Boolean)
      : ['*'];

    setIsSubmittingElection(true);
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        networkType: newNetworkType,
        allowedIps: ipsList,
        networkLabel: newNetworkLabel.trim() || (newNetworkType === 'ALL' ? 'All Public Traffic' : 'Restricted Network'),
        candidateIds: selectedExistingMemberIds,
        newCandidates: inlineNewMembers
      };

      const res = await fetch(`${API_BASE_URL}/admin/elections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        addToast(`Election "${created.title}" successfully created!`, 'success');
        // Reset form
        setNewTitle('');
        setNewDescription('');
        setNewNetworkType('ALL');
        setNewAllowedIps('127.0.0.1, 192.168.1.*');
        setNewNetworkLabel('');
        setSelectedExistingMemberIds([]);
        setInlineNewMembers([]);
        setShowCreateElection(false);
        fetchElections();
        fetchMembers();
      } else {
        const err = await res.text();
        addToast(`Failed to create election: ${err}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error creating election.', 'error');
    } finally {
      setIsSubmittingElection(false);
    }
  };

  const handleCreateStandaloneMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      addToast('Member name is required.', 'error');
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify({
          name: newMemberName.trim(),
          partyColor: newMemberColor
        })
      });

      if (res.ok) {
        addToast(`Member "${newMemberName}" added to directory.`, 'success');
        setNewMemberName('');
        setNewMemberColor('#3b82f6');
        fetchMembers();
      } else {
        addToast('Failed to add member.', 'error');
      }
    } catch {
      addToast('Network error adding member.', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddCandidateToElection = async (e) => {
    e.preventDefault();
    if (!addCandElectionId) return;

    setIsAddingCandToElec(true);
    try {
      const payload = addCandMemberId
        ? { memberId: addCandMemberId }
        : { name: addCandName.trim(), partyColor: addCandColor };

      const res = await fetch(`${API_BASE_URL}/admin/elections/${addCandElectionId}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast('Candidate added to election successfully.', 'success');
        setAddCandElectionId(null);
        setAddCandMemberId('');
        setAddCandName('');
        fetchElections();
        fetchMembers();
      } else {
        addToast('Failed to add candidate to election.', 'error');
      }
    } catch {
      addToast('Network error adding candidate to election.', 'error');
    } finally {
      setIsAddingCandToElec(false);
    }
  };

  const handleRemoveCandidateFromElection = async (electionId, candidateId, candidateName) => {
    if (!window.confirm(`Remove candidate "${candidateName}" from this election?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/elections/${electionId}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (res.ok) {
        addToast(`Removed candidate from election.`, 'info');
        fetchElections();
      } else {
        addToast('Failed to remove candidate.', 'error');
      }
    } catch {
      addToast('Network error removing candidate.', 'error');
    }
  };

  const fetchLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const url = ledgerElectionFilter 
        ? `${API_BASE_URL}/admin/insights/raw-ledger?electionId=${ledgerElectionFilter}`
        : `${API_BASE_URL}/admin/insights/raw-ledger`;

      const res = await fetch(url, {
        headers: { 'X-Admin-Secret': adminSecret }
      });
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
        addToast('Ledger loaded successfully.', 'info');
      }
    } catch {
      addToast('Failed to load ledger.', 'error');
    } finally {
      setIsLoadingLedger(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Authentication Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Shield className="h-6 w-6 text-brand-400" />
              Administrative Command Center
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure multi-elections, traffic network restrictions, and network-wise vote analysis.
            </p>
          </div>

          {!isLoggedIn ? (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex gap-2 w-full sm:w-auto">
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter Admin Secret Key..."
                className="bg-slate-950 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 w-full sm:w-64"
              />
              <button
                type="submit"
                disabled={isLoggingIn || !adminSecret}
                className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isLoggingIn ? 'Verifying...' : 'Login'}
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Root Admin Authenticated
              </span>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setAdminSecret('');
                  sessionStorage.removeItem('adminSecret');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <>
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('elections')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'elections'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Elections Manager</span>
              <span className="bg-slate-950/60 px-2 py-0.5 rounded-full text-xs font-mono ml-1">
                {elections.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                if (elections.length > 0 && !selectedElectionForAnalytics) {
                  setSelectedElectionForAnalytics(elections[0].id);
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Network Vote Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'members'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Member Directory</span>
              <span className="bg-slate-950/60 px-2 py-0.5 rounded-full text-xs font-mono ml-1">
                {members.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ledger');
                fetchLedger();
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Raw Ledger Audit</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: ELECTIONS MANAGER                                       */}
          {/* ============================================================== */}
          {activeTab === 'elections' && (
            <div className="space-y-6">
              
              {/* Header + Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white">Elections Management</h3>
                  <p className="text-slate-400 text-sm">
                    Create standalone elections, add existing or new candidates, and restrict visibility by network IP.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateElection(!showCreateElection)}
                  className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg hover:shadow-brand-500/20 flex items-center gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>{showCreateElection ? 'Cancel Creation' : 'Create New Election'}</span>
                </button>
              </div>

              {/* Create New Election Accordion/Panel */}
              {showCreateElection && (
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-brand-500/40 shadow-2xl space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-brand-400" />
                      Configure New Election
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">
                      Set up election metadata, define IP traffic restrictions, and assign candidates.
                    </p>
                  </div>

                  <form onSubmit={handleCreateElection} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: General Info */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Election Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Computer Science Student Council Election"
                            className="w-full bg-slate-950 border border-slate-700 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Briefly describe the scope and purpose of this election..."
                            className="w-full bg-slate-950 border border-slate-700 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
                          />
                        </div>

                        {/* Network Restrictions */}
                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-brand-400" />
                            Network Access Control (IP Filtering)
                          </label>

                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                              <input
                                type="radio"
                                name="networkType"
                                value="ALL"
                                checked={newNetworkType === 'ALL'}
                                onChange={() => setNewNetworkType('ALL')}
                                className="accent-brand-500"
                              />
                              <span>All Traffic (Public / Any IP)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                              <input
                                type="radio"
                                name="networkType"
                                value="RESTRICTED"
                                checked={newNetworkType === 'RESTRICTED'}
                                onChange={() => setNewNetworkType('RESTRICTED')}
                                className="accent-brand-500"
                              />
                              <span>Restricted Network (Specific IPs)</span>
                            </label>
                          </div>

                          {newNetworkType === 'RESTRICTED' && (
                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  Allowed IP Addresses (Comma-separated exact IPs or wildcards like 192.168.1.*)
                                </label>
                                <input
                                  type="text"
                                  value={newAllowedIps}
                                  onChange={(e) => setNewAllowedIps(e.target.value)}
                                  placeholder="e.g. 127.0.0.1, 192.168.1.*, 10.0.0.25"
                                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                                />
                                <div className="flex gap-1.5 flex-wrap mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setNewAllowedIps(prev => prev ? `${prev}, 127.0.0.1` : '127.0.0.1')}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono"
                                  >
                                    + 127.0.0.1 (Localhost)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNewAllowedIps(prev => prev ? `${prev}, 192.168.1.*` : '192.168.1.*')}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono"
                                  >
                                    + 192.168.1.* (CS Dept)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNewAllowedIps(prev => prev ? `${prev}, 10.0.*` : '10.0.*')}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono"
                                  >
                                    + 10.0.* (Campus Dorms)
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                  Friendly Network Label
                                </label>
                                <input
                                  type="text"
                                  value={newNetworkLabel}
                                  onChange={(e) => setNewNetworkLabel(e.target.value)}
                                  placeholder="e.g. Computer Science Department LAN"
                                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Members & Candidates Assignment */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>1. Select Existing Members</span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              {selectedExistingMemberIds.length} selected
                            </span>
                          </label>

                          <div className="max-h-48 overflow-y-auto bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                            {members.length === 0 ? (
                              <p className="text-xs text-slate-500 py-3 text-center">No existing members in directory.</p>
                            ) : (
                              members.map(member => {
                                const isChecked = selectedExistingMemberIds.includes(member.id);
                                return (
                                  <label
                                    key={member.id}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-brand-500/20 border-brand-500/50 text-white'
                                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setSelectedExistingMemberIds(selectedExistingMemberIds.filter(id => id !== member.id));
                                          } else {
                                            setSelectedExistingMemberIds([...selectedExistingMemberIds, member.id]);
                                          }
                                        }}
                                        className="accent-brand-500"
                                      />
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: member.partyColor || '#3b82f6' }}
                                      ></div>
                                      <span className="text-sm font-bold">{member.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">{member.id}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 2. Add New Member Inline */}
                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                            2. Or Add New Member to this Election
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={inlineMemberName}
                              onChange={(e) => setInlineMemberName(e.target.value)}
                              placeholder="New candidate name..."
                              className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                            />
                            <input
                              type="color"
                              value={inlineMemberColor}
                              onChange={(e) => setInlineMemberColor(e.target.value)}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0 self-center"
                            />
                            <button
                              type="button"
                              onClick={handleAddInlineMember}
                              disabled={!inlineMemberName.trim()}
                              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                              + Add
                            </button>
                          </div>

                          {/* List of inline added candidates */}
                          {inlineNewMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {inlineNewMembers.map((m, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-white"
                                >
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.partyColor }}></span>
                                  <span>{m.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setInlineNewMembers(inlineNewMembers.filter((_, i) => i !== idx))}
                                    className="ml-1 text-slate-400 hover:text-rose-400"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowCreateElection(false)}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingElection}
                        className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg disabled:opacity-50"
                      >
                        {isSubmittingElection ? 'Creating Election...' : 'Launch Election'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Elections List Cards */}
              <div className="space-y-4">
                {isLoadingElections ? (
                  <div className="text-center py-12 text-slate-400">Loading elections...</div>
                ) : elections.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-3xl">
                    <p className="text-slate-400 text-base">No elections have been created yet. Click "Create New Election" above.</p>
                  </div>
                ) : (
                  elections.map((election) => (
                    <div
                      key={election.id}
                      className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-xl font-black text-white">{election.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            election.open
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {election.open ? 'OPEN' : 'CLOSED'}
                          </span>

                          <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 font-mono">
                            <Shield className="h-3 w-3 text-brand-400" />
                            {election.networkLabel || (election.networkType === 'ALL' ? 'Open to All IPs' : 'Restricted')}
                          </span>
                        </div>

                        <p className="text-slate-400 text-sm">{election.description || 'No description provided.'}</p>

                        {/* Candidates in this election */}
                        <div className="flex items-center gap-2 flex-wrap pt-2">
                          <span className="text-xs text-slate-500 font-semibold mr-1">Candidates:</span>
                          {election.candidates?.map((cand) => (
                            <span
                              key={cand.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200"
                            >
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cand.partyColor || '#3b82f6' }}></span>
                              <span>{cand.name}</span>
                              <span className="font-mono text-brand-400 font-bold ml-1">({cand.voteCount || 0})</span>
                              <button
                                onClick={() => handleRemoveCandidateFromElection(election.id, cand.id, cand.name)}
                                title="Remove candidate from election"
                                className="ml-1 text-slate-500 hover:text-rose-400 text-sm font-bold leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          
                          <button
                            onClick={() => {
                              setAddCandElectionId(election.id);
                              setAddCandMemberId('');
                              setAddCandName('');
                            }}
                            className="text-xs font-bold text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-full border border-brand-500/20 transition-colors"
                          >
                            + Add Candidate
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                        <button
                          onClick={() => toggleElectionStatus(election.id, !election.open)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            election.open
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{election.open ? 'Close Election' : 'Open Election'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedElectionForAnalytics(election.id);
                            setActiveTab('analytics');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-colors flex items-center gap-1.5"
                        >
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span>Network Analytics</span>
                        </button>

                        <button
                          onClick={() => handleDeleteElection(election.id, election.title)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Election"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Candidate Modal */}
              {addCandElectionId && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
                    <h4 className="text-xl font-bold text-white">Add Candidate to Election</h4>
                    <p className="text-xs text-slate-400">Choose from directory or create a new candidate.</p>

                    <form onSubmit={handleAddCandidateToElection} className="space-y-4">
                      {members.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                            Select Existing Member:
                          </label>
                          <select
                            value={addCandMemberId}
                            onChange={(e) => setAddCandMemberId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
                          >
                            <option value="">-- Or enter new candidate below --</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!addCandMemberId && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                              New Candidate Name
                            </label>
                            <input
                              type="text"
                              value={addCandName}
                              onChange={(e) => setAddCandName(e.target.value)}
                              placeholder="e.g. John Doe"
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                              Party Color
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={addCandColor}
                                onChange={(e) => setAddCandColor(e.target.value)}
                                className="h-9 w-9 rounded cursor-pointer border-0 p-0"
                              />
                              <input
                                type="text"
                                value={addCandColor}
                                onChange={(e) => setAddCandColor(e.target.value)}
                                className="w-28 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-white uppercase"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setAddCandElectionId(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingCandToElec || (!addCandMemberId && !addCandName.trim())}
                          className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                        >
                          {isAddingCandToElec ? 'Adding...' : 'Add to Election'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: NETWORK VOTE ANALYTICS (GROUPING OPTIONS)               */}
          {/* ============================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Header & Election Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-purple-400" />
                    Network-Wise Vote Analytics
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Analyze votes network-wise with respect to IP addresses and demographic domains.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Election:
                  </label>
                  <select
                    value={selectedElectionForAnalytics || ''}
                    onChange={(e) => setSelectedElectionForAnalytics(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500 w-full sm:w-64"
                  >
                    {elections.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KPI Summary Cards */}
              {analyticsData?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Votes Cast</p>
                    <p className="text-3xl font-black text-white font-mono">{analyticsData.summary.totalVotes}</p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Unique IP Addresses</p>
                    <p className="text-3xl font-black text-purple-400 font-mono">{analyticsData.summary.uniqueIps}</p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Network Access Type</p>
                    <p className="text-lg font-bold text-white truncate">{analyticsData.summary.networkType === 'ALL' ? 'Open (All Traffic)' : 'Restricted Subnet'}</p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      analyticsData.summary.isOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {analyticsData.summary.isOpen ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
              )}

              {/* Grouping Mode Switcher */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                    Grouping Option:
                  </span>
                  
                  <button
                    onClick={() => setGroupingMode('network')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      groupingMode === 'network'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>Group by Network / Subnet</span>
                  </button>

                  <button
                    onClick={() => setGroupingMode('ip')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      groupingMode === 'ip'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Group by Exact IP Address</span>
                  </button>

                  <button
                    onClick={() => setGroupingMode('candidate')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      groupingMode === 'candidate'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Group by Candidate & Network</span>
                  </button>
                </div>

                {/* Search Bar for Grouping Views */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={analyticsSearch}
                      onChange={(e) => setAnalyticsSearch(e.target.value)}
                      placeholder="Filter IP or network..."
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchAnalytics(selectedElectionForAnalytics)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Refresh Analytics"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* GROUPING VIEW CONTENT */}
              {isLoadingAnalytics ? (
                <div className="text-center py-12 text-slate-400">Loading network vote data...</div>
              ) : !analyticsData ? (
                <div className="glass-panel p-12 text-center rounded-3xl">
                  <p className="text-slate-400">Select an election to inspect network-wise votes.</p>
                </div>
              ) : (
                <>
                  {/* OPTION A: Group by Network / Subnet */}
                  {groupingMode === 'network' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analyticsData.groupByNetwork
                        ?.filter(net => !analyticsSearch || net.networkName.toLowerCase().includes(analyticsSearch.toLowerCase()))
                        .map((net, idx) => (
                          <div key={idx} className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-lg font-black text-white flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-purple-400" />
                                  {net.networkName}
                                </h4>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                  {net.uniqueIpsCount} unique voter IP{net.uniqueIpsCount !== 1 ? 's' : ''}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-2xl font-black text-purple-400 font-mono">{net.voteCount}</span>
                                <span className="text-xs text-slate-500 block">votes ({net.percentage}%)</span>
                              </div>
                            </div>

                            {/* Percentage Bar */}
                            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${net.percentage}%` }}
                              ></div>
                            </div>

                            {/* Candidate Breakdown in this Network */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Candidate Votes in this Network:
                              </p>
                              <div className="space-y-1.5">
                                {Object.entries(net.candidateBreakdown || {}).map(([cName, count]) => (
                                  <div key={cName} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-300 font-medium">{cName}</span>
                                    <span className="bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full font-mono text-brand-300 font-bold">
                                      {count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* List of IP addresses in this network */}
                            <div className="pt-2 border-t border-slate-800/80">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Participating IP Addresses:
                              </p>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                {net.ips?.map((ip, i) => (
                                  <span key={i} className="text-[11px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                                    {ip}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      {analyticsData.groupByNetwork?.length === 0 && (
                        <div className="col-span-2 glass-panel p-12 text-center rounded-3xl text-slate-400">
                          No votes recorded in this election yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION B: Group by Exact IP Address */}
                  {groupingMode === 'ip' && (
                    <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                      <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                        <h4 className="font-bold text-white text-base">Individual IP Address Voting Log</h4>
                        <span className="text-xs font-mono text-slate-400">
                          {analyticsData.groupByIp?.length || 0} Total IP Records
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                              <th className="py-3 px-6">Voter IP Address</th>
                              <th className="py-3 px-6">Network Classification</th>
                              <th className="py-3 px-6">Candidate Selected</th>
                              <th className="py-3 px-6">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-sm">
                            {analyticsData.groupByIp
                              ?.filter(item => 
                                !analyticsSearch || 
                                item.ipAddress.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                                item.candidateName.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                                item.networkGroup.toLowerCase().includes(analyticsSearch.toLowerCase())
                              )
                              .map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3.5 px-6 font-mono text-brand-300 font-semibold">{item.ipAddress}</td>
                                  <td className="py-3.5 px-6">
                                    <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
                                      {item.networkGroup}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-6 font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.partyColor || '#3b82f6' }}></span>
                                    <span>{item.candidateName}</span>
                                  </td>
                                  <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            {analyticsData.groupByIp?.length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-500">
                                  No IP voting records found for this election.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* OPTION C: Group by Candidate & Network */}
                  {groupingMode === 'candidate' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {analyticsData.groupByCandidate
                        ?.filter(c => !analyticsSearch || c.name.toLowerCase().includes(analyticsSearch.toLowerCase()))
                        .map((c) => (
                          <div key={c.candidateId} className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md"
                                  style={{ backgroundColor: c.partyColor || '#3b82f6' }}
                                >
                                  {c.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-white text-lg">{c.name}</h4>
                                  <p className="text-xs font-mono text-slate-400">{c.candidateId}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-white font-mono">{c.voteCount}</span>
                                <span className="text-xs text-slate-500 block">votes</span>
                              </div>
                            </div>

                            {/* Network breakdown for this candidate */}
                            <div className="pt-3 border-t border-slate-800 space-y-2">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Network Vote Breakdown:
                              </p>
                              {Object.entries(c.networkBreakdown || {}).length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No network votes recorded yet.</p>
                              ) : (
                                Object.entries(c.networkBreakdown).map(([network, count]) => (
                                  <div key={network} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-300">{network}</span>
                                    <span className="bg-slate-900 px-2 py-0.5 rounded font-mono font-bold text-brand-300">
                                      {count}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Specific Voter IPs for this Candidate */}
                            <div className="pt-3 border-t border-slate-800">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Voter IP Addresses ({c.voters?.length || 0}):
                              </p>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {c.voters?.map((v, idx) => (
                                  <span key={idx} className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-850">
                                    {v.ipAddress}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: MEMBER DIRECTORY                                        */}
          {/* ============================================================== */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white">Registered Members Directory</h3>
                  <p className="text-slate-400 text-sm">
                    Global pool of candidates and members that can be added into any election.
                  </p>
                </div>
              </div>

              {/* Add Member Form */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-brand-400" />
                  Add Member to Directory
                </h4>
                <form onSubmit={handleCreateStandaloneMember} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Member Name
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Diana Prince"
                      className="w-full bg-slate-950 border border-slate-700 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Party / Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newMemberColor}
                        onChange={(e) => setNewMemberColor(e.target.value)}
                        className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={newMemberColor}
                        onChange={(e) => setNewMemberColor(e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-700 px-2 py-2 rounded-lg text-xs font-mono text-white uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingMember || !newMemberName.trim()}
                    className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {isAddingMember ? 'Saving...' : 'Add Member'}
                  </button>
                </form>
              </div>

              {/* Member Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {members.map(member => (
                  <div key={member.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ backgroundColor: member.partyColor || '#3b82f6' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-white text-base truncate">{member.name}</p>
                      <p className="text-xs font-mono text-slate-500 truncate">{member.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: RAW LEDGER AUDIT                                        */}
          {/* ============================================================== */}
          {activeTab === 'ledger' && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Download className="h-5 w-5 text-brand-400" />
                    Immutable Voting Ledger Audit
                  </h3>
                  <p className="text-slate-400 text-xs">Verify all cryptographic votes with timestamps and originating IPs.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ledgerElectionFilter}
                    onChange={(e) => setLedgerElectionFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl"
                  >
                    <option value="">All Elections</option>
                    {elections.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>

                  <button
                    onClick={fetchLedger}
                    disabled={isLoadingLedger}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isLoadingLedger ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold bg-slate-950/60">
                      <th className="py-3 px-4">Ledger ID</th>
                      <th className="py-3 px-4">Election ID</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Network Group</th>
                      <th className="py-3 px-4">Candidate ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          No ledger records to display.
                        </td>
                      </tr>
                    ) : (
                      ledger.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-400">{rec.id || `rec_${i}`}</td>
                          <td className="py-3 px-4 text-brand-300">{rec.electionId || 'elec_default'}</td>
                          <td className="py-3 px-4 text-white font-bold">{rec.ipAddress}</td>
                          <td className="py-3 px-4 text-purple-300 font-sans">{rec.networkGroup || 'Standard'}</td>
                          <td className="py-3 px-4 text-emerald-400">{rec.candidateId}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
