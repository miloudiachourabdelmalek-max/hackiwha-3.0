import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

const FLAGS = { DZ: '🇩🇿', FR: '🇫🇷', MA: '🇲🇦', TN: '🇹🇳', EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', TR: '🇹🇷' };
const RESULT_COLORS = { WINNER: 'badge-green', FAIL: 'badge-red', BREAK_EVEN: 'badge-yellow', UNKNOWN: 'badge-gray' };
const RESULT_LABELS = { WINNER: 'Winner', FAIL: 'Failed', BREAK_EVEN: 'Break Even', UNKNOWN: 'Unknown' };

function ExperimentCard({ exp, onClick }) {
  return (
    <div onClick={onClick} className="card card-hover cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <span className={`badge ${RESULT_COLORS[exp.result]}`}>{RESULT_LABELS[exp.result]}</span>
        <span className="text-xs text-slate-400">{exp.startDate?.split('T')[0]}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">{exp.title}</h3>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{FLAGS[exp.country]}</span>
        <span className="text-xs text-slate-500">{exp.product}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
          <p className="text-xs text-slate-400">ROAS</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{Number(exp.roas || 0).toFixed(1)}x</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
          <p className="text-xs text-slate-400">Budget</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">${Number(exp.budget || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
          <p className="text-xs text-slate-400">Revenue</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">${Number(exp.revenue || 0).toLocaleString()}</p>
        </div>
      </div>
      {exp.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {exp.tags.slice(0, 4).map((t) => (
            <span key={t.id || t.tag} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">{t.tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperimentDetail({ exp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <span className={`badge ${RESULT_COLORS[exp.result]}`}>{RESULT_LABELS[exp.result]}</span>
          <button onClick={onClose} className="btn-ghost p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{exp.title}</h2>
        <p className="text-sm text-slate-500 mb-4">{exp.description}</p>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm">{FLAGS[exp.country]} {exp.country}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">{exp.product}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">{exp.creativeType}</span>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">ROAS</p><p className="text-lg font-bold text-slate-900 dark:text-white">{Number(exp.roas || 0).toFixed(1)}x</p></div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">CPA</p><p className="text-lg font-bold text-slate-900 dark:text-white">${Number(exp.cpa || 0).toFixed(0)}</p></div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">Revenue</p><p className="text-lg font-bold text-slate-900 dark:text-white">${Number(exp.revenue || 0).toLocaleString()}</p></div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">Profit</p><p className="text-lg font-bold text-slate-900 dark:text-white">${Number(exp.profit || 0).toLocaleString()}</p></div>
        </div>
        {exp.lessonsLearned && (
          <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">Lessons Learned</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{exp.lessonsLearned}</p>
          </div>
        )}
        {exp.mistakes && (
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Mistakes</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{exp.mistakes}</p>
          </div>
        )}
        {exp.recommendations && (
          <div className="bg-brand-50 dark:bg-brand-900/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider mb-2">Recommendations</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{exp.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketingMemory() {
  const [resultFilter, setResultFilter] = useState('');
  const [selectedExp, setSelectedExp] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['experiments', resultFilter],
    queryFn: async () => {
      const params = resultFilter ? `?result=${resultFilter}` : '';
      const r = await api.get(`/experiments${params}`);
      return r.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['experiment-stats'],
    queryFn: async () => { const r = await api.get('/experiments/stats'); return r.data.data; },
  });

  const winners = stats?.byResult?.find((r) => r.result === 'WINNER')?._count || 0;
  const fails = stats?.byResult?.find((r) => r.result === 'FAIL')?._count || 0;
  const total = stats?.aggregates?._count || 0;
  const winRate = total > 0 ? Math.round((winners / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing Memory</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Every campaign becomes company knowledge</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center"><p className="text-xs text-slate-400 uppercase">Total</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400 uppercase">Winners</p><p className="text-2xl font-bold text-teal-500">{winners}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400 uppercase">Failed</p><p className="text-2xl font-bold text-red-500">{fails}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400 uppercase">Win Rate</p><p className="text-2xl font-bold text-brand-500">{winRate}%</p></div>
      </div>

      <div className="flex gap-2">
        {[{ value: '', label: 'All' }, { value: 'WINNER', label: 'Winners' }, { value: 'FAIL', label: 'Failed' }, { value: 'BREAK_EVEN', label: 'Break Even' }].map((f) => (
          <button key={f.value} onClick={() => setResultFilter(f.value)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${resultFilter === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{f.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((exp) => (
            <ExperimentCard key={exp.id} exp={exp} onClick={() => setSelectedExp(exp)} />
          ))}
        </div>
      )}

      {selectedExp && <ExperimentDetail exp={selectedExp} onClose={() => setSelectedExp(null)} />}
    </div>
  );
}
