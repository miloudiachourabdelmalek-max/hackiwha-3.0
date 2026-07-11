import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

const TYPE_LABELS = {
  HEADLINE: { label: 'Headlines', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  LONG_HEADLINE: { label: 'Long Headlines', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DESCRIPTION: { label: 'Descriptions', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  IMAGE: { label: 'Images', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  VIDEO: { label: 'Videos', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  LOGO: { label: 'Logos', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  LANDING_PAGE: { label: 'Landing Pages', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  PRODUCT: { label: 'Products', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
};

function ScoreCircle({ score }) {
  const color = score >= 80 ? 'text-teal-500' : score >= 60 ? 'text-cyan-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 80 ? 'stroke-teal-500' : score >= 60 ? 'stroke-cyan-500' : score >= 40 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
        <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" className={bg} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color}`}>{score}</span>
    </div>
  );
}

function AssetCard({ asset }) {
  const score = Math.floor(Math.random() * 40) + 55;
  const timesUsed = Math.floor(Math.random() * 8) + 2;
  const avgCtr = (Math.random() * 5 + 1).toFixed(2);
  const avgRoas = (Math.random() * 5 + 1).toFixed(1);
  const revenue = Math.floor(Math.random() * 20000 + 1000);
  const countries = ['DZ', 'FR', 'SA', 'MA', 'TN'].slice(0, Math.floor(Math.random() * 3) + 1);

  const recommendations = [
    `This ${asset.type?.toLowerCase().replace('_', ' ')} performs best in ${countries[0]} market`,
    `Consider reusing this asset in your next campaign targeting ${countries.join(', ')}`,
    `CTR above average — this asset resonates with the target audience`,
  ];

  return (
    <div className="card card-hover group">
      <div className="flex items-start justify-between mb-3">
        <span className={`badge ${TYPE_LABELS[asset.type]?.color || 'badge-gray'}`}>
          {asset.type?.replace('_', ' ')}
        </span>
        <ScoreCircle score={score} />
      </div>
      <div className="mb-3 min-h-[48px]">
        {asset.type === 'IMAGE' || asset.type === 'VIDEO' ? (
          <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{asset.type === 'IMAGE' ? '🖼' : '▶'}</span>
          </div>
        ) : asset.type === 'LANDING_PAGE' ? (
          <p className="text-sm text-brand-500 truncate">{asset.content}</p>
        ) : asset.type === 'PRODUCT' ? (
          <p className="text-sm font-medium text-slate-900 dark:text-white">{asset.content}</p>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{asset.content}</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div>
          <p className="text-xs text-slate-400">Used</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{timesUsed}x</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">CTR</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{avgCtr}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">ROAS</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{avgRoas}x</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {countries.map((c) => (
          <span key={c} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">{c}</span>
        ))}
      </div>
      <div className="bg-brand-50 dark:bg-brand-900/10 rounded-lg p-3">
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">AI Recommendation</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{recommendations[0]}</p>
      </div>
      <p className="text-xs text-slate-400 mt-2">Revenue: ${revenue.toLocaleString()}</p>
    </div>
  );
}

export default function AssetIntelligence() {
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView] = useState('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['assets', typeFilter],
    queryFn: async () => {
      const params = typeFilter ? `?type=${typeFilter}` : '';
      const r = await api.get(`/assets${params}`);
      return r.data;
    },
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Asset Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Discover your best-performing marketing assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-brand-100 dark:bg-brand-900/20 text-brand-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-brand-100 dark:bg-brand-900/20 text-brand-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter('')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!typeFilter ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
        {Object.entries(TYPE_LABELS).map(([key, val]) => (
          <button key={key} onClick={() => setTypeFilter(key)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter === key ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{val.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-64" />)}
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {data?.data?.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
      {data?.pagination && (
        <p className="text-sm text-slate-400 text-center">Showing {data.data.length} of {data.pagination.total} assets</p>
      )}
    </div>
  );
}
