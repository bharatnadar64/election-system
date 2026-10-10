import CandidateCard from './CandidateCard';

export default function VotePage({ candidates, hasLoaded, castVote }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Voting Booth</h1>
          <p className="text-slate-500 mt-1">Select your preferred candidate to cast your vote.</p>
        </div>
        
        {!hasLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* Skeleton Loaders */}
             {[1, 2, 3].map(i => (
               <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>
             ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700">No Candidates Available</h3>
            <p className="text-slate-500 mt-2">The election currently has no candidates registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onVote={() => castVote(candidate.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
