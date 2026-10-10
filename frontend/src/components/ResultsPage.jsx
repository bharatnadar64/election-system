import LiveChart from './LiveChart';

export default function ResultsPage({ candidates, hasLoaded }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <section>
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Live Results</h2>
          <p className="text-slate-500 mt-1">Real-time vote counting and demographic breakdown.</p>
        </div>
        
        {!hasLoaded ? (
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col space-y-6">
             {[1, 2, 3].map((i) => (
               <div key={i} className="w-full">
                 <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4 mb-2"></div>
                 <div className="h-10 bg-slate-100 rounded-full animate-pulse w-full"></div>
               </div>
             ))}
           </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700">No Candidates Available</h3>
            <p className="text-slate-500 mt-2">The election currently has no candidates registered.</p>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <LiveChart candidates={candidates} />
          </div>
        )}
      </section>
    </div>
  );
}
