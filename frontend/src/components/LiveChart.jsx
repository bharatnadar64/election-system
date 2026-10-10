import { useState } from 'react';

export default function LiveChart({ candidates }) {
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex flex-col space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4 mb-2"></div>
            <div className="h-10 bg-slate-100 rounded-full animate-pulse w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate maximum votes to scale the bars relative to the winner
  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1); // fallback to 1 to avoid division by zero

  // Sort candidates by vote count descending
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="space-y-8">
      {sortedCandidates.map((candidate) => {
        const percentage = Math.max((candidate.voteCount / maxVotes) * 100, 2); // At least 2% to show the bar

        return (
          <div key={candidate.id} className="relative">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-slate-800 text-lg">
                {candidate.name}
              </span>
              <span className="font-bold text-slate-600 text-lg">
                {candidate.voteCount.toLocaleString()}
              </span>
            </div>
            
            <div 
              className="h-10 w-full bg-slate-100 rounded-full overflow-hidden relative group cursor-pointer"
              onMouseEnter={() => setHoveredCandidateId(candidate.id)}
              onMouseLeave={() => setHoveredCandidateId(null)}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: candidate.partyColor || '#3b82f6',
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                }}
              ></div>
            </div>

            {/* Tooltip for Network Breakdown */}
            {hoveredCandidateId === candidate.id && candidate.networkBreakdown && (
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-slate-800 text-white text-sm rounded-xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="font-semibold text-slate-300 mb-2 border-b border-slate-600 pb-1">
                  Demographic Breakdown
                </div>
                <div className="space-y-1">
                  {Object.entries(candidate.networkBreakdown).map(([network, count]) => (
                    <div key={network} className="flex justify-between">
                      <span className="text-slate-400">{network}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                  {Object.keys(candidate.networkBreakdown).length === 0 && (
                    <div className="text-slate-500 italic">No demographic data available.</div>
                  )}
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
