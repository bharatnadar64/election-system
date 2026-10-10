import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type }) {
  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      className={`flex items-center p-4 mb-2 w-full max-w-sm text-sm rounded-xl shadow-lg border transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${
        isError
          ? 'bg-red-50 text-red-800 border-red-200'
          : isSuccess
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-white text-slate-800 border-slate-200'
      }`}
      role="alert"
    >
      <div className="mr-3">
        {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        {!isError && !isSuccess && <Info className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="font-medium">{message}</div>
    </div>
  );
}
