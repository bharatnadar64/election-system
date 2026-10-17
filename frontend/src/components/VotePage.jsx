import { motion } from 'framer-motion';
import CandidateCard from './CandidateCard';
import { Shield, ArrowLeft, CheckCircle2, AlertCircle, Users, Globe } from 'lucide-react';

export default function VotePage({
  elections = [],
  selectedElectionId,
  setSelectedElectionId,
  hasLoaded,
  castVote,
  detectedIp,
  networkGroup,
  myVotes = {}
}) {
  const currentElection = elections.find(e => e.id === selectedElectionId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // If no specific election is selected (or if user is in elections directory)
  if (!selectedElectionId || !currentElection) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold tracking-widest uppercase mb-4 border border-brand-500/30 shadow-sm">
              <Globe className="h-3.5 w-3.5" /> Network-Authorized Voting
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 glow-effect">Elections</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              Your network address (<span className="font-mono text-brand-300 font-bold">{detectedIp || 'Resolving...'}</span>
              {networkGroup ? <span className="text-slate-400 font-medium"> • {networkGroup}</span> : null}) is eligible to participate in the elections listed below.
            </p>
          </motion.div>
        </div>

        {!hasLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 glass-panel rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-12 text-center rounded-3xl max-w-xl mx-auto border border-slate-700/60">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Accessible Elections Found</h3>
            <p className="text-slate-400 text-sm mb-4">
              There are currently no active elections configured to accept traffic from your IP address (<span className="font-mono text-slate-200">{detectedIp}</span>).
            </p>
            <p className="text-slate-500 text-xs">
              If this is unexpected, contact your election administrator to add your network to the election's allowed IP list.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {elections.map((election) => {
              const userVotedCandidateId = myVotes[election.id];
              const userVotedCandidate = election.candidates?.find(c => c.id === userVotedCandidateId);

              return (
                <motion.div
                  key={election.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="glass-panel rounded-3xl p-6 border border-slate-700/60 flex flex-col justify-between hover:border-brand-500/50 transition-all shadow-xl group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    {/* Header tags */}
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        election.open 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {election.open ? '• Active Election' : '• Closed'}
                      </span>

                      <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50 flex items-center gap-1 truncate max-w-[170px]">
                        <Shield className="h-3 w-3 text-brand-400 shrink-0" />
                        <span className="truncate">{election.networkLabel || (election.networkType === 'ALL' ? 'All Traffic' : 'Restricted IP')}</span>
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-brand-300 transition-colors">
                      {election.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                      {election.description || 'Cast your ballot in this authorized election.'}
                    </p>

                    {/* Candidate Avatars preview */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {election.candidates?.length || 0} Registered Champions
                        </span>
                        <span>{election.candidates?.reduce((acc, c) => acc + (c.voteCount || 0), 0)} Total Votes</span>
                      </div>

                      <div className="flex -space-x-2 overflow-hidden py-1">
                        {election.candidates?.slice(0, 5).map((cand) => (
                          <div
                            key={cand.id}
                            title={cand.name}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-md"
                            style={{ backgroundColor: cand.partyColor || '#3b82f6' }}
                          >
                            {cand.name.charAt(0)}
                          </div>
                        ))}
                        {(election.candidates?.length || 0) > 5 && (
                          <div className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                            +{election.candidates.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    {userVotedCandidate && (
                      <div className="mb-4 bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-brand-300">
                        <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
                        <span>You voted for: <strong className="text-white">{userVotedCandidate.name}</strong></span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedElectionId(election.id)}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-brand-500/20 active:scale-98 flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Enter Voting Room</span>
                    <span className="text-lg">→</span>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  // Inside Specific Selected Election
  const userVotedCandidateId = myVotes[currentElection.id];
  const userVotedCandidate = currentElection.candidates?.find(c => c.id === userVotedCandidateId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <button
          onClick={() => setSelectedElectionId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/60 hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-700/60"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Elections</span>
        </button>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            currentElection.open 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {currentElection.open ? 'Live Voting Open' : 'Election Closed'}
          </span>

          <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
            {currentElection.networkLabel || (currentElection.networkType === 'ALL' ? 'Open Network' : 'Restricted Network')}
          </span>
        </div>
      </div>

      {/* Election Title Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          {currentElection.title}
        </h1>
        <p className="text-slate-400 text-lg mb-4">
          {currentElection.description || 'Select your preferred champion below and cast your official vote.'}
        </p>

        {userVotedCandidate && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 px-4 py-2 rounded-2xl text-sm text-brand-300 font-medium"
          >
            <CheckCircle2 className="h-4 w-4 text-brand-400" />
            <span>Your registered vote: <strong className="text-white underline decoration-brand-400">{userVotedCandidate.name}</strong>. (You can change your vote anytime)</span>
          </motion.div>
        )}
      </div>

      {/* Candidate Cards Grid */}
      {(!currentElection.candidates || currentElection.candidates.length === 0) ? (
        <div className="glass-panel p-16 text-center rounded-3xl max-w-lg mx-auto">
          <h3 className="text-2xl font-bold text-white mb-2">No Candidates Registered</h3>
          <p className="text-slate-400 text-sm">Candidates have not yet been assigned to this election.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {currentElection.candidates.map((candidate) => (
            <motion.div key={candidate.id} variants={itemVariants}>
              <CandidateCard
                candidate={candidate}
                isVoted={userVotedCandidateId === candidate.id}
                isDisabled={!currentElection.open}
                onVote={() => castVote(currentElection.id, candidate.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
