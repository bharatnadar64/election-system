export default function CandidateCard({ candidate, onVote }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between h-full">
      {/* Accent Top Border */}
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: candidate.partyColor || '#cbd5e1' }}
      ></div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-inner"
            style={{ backgroundColor: candidate.partyColor || '#94a3b8' }}
          >
            {candidate.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{candidate.name}</h3>
            <p className="text-sm font-medium text-slate-500">Candidate ID: {candidate.id}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onVote}
        className="mt-6 w-full py-3 px-4 rounded-xl font-semibold text-white transition-all transform active:scale-95 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ 
          backgroundColor: candidate.partyColor || '#3b82f6',
          boxShadow: `0 4px 14px 0 ${candidate.partyColor || '#3b82f6'}40`
        }}
      >
        Vote for {candidate.name.split(' ')[0]}
      </button>
    </div>
  );
}
