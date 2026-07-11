import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function Header({ dark, onToggleDark, onToggleSidebar }) {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length >= 2) {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data.data);
      } catch { setSearchResults(null); }
    } else {
      setSearchResults(null);
    }
  };

  const goToResult = (type, id) => {
    setSearchQuery('');
    setSearchResults(null);
    if (type === 'campaign' && id) navigate(`/dashboard/campaigns/${id}`);
    else if (type === 'experiment') navigate('/dashboard/memory');
    else if (type === 'memory') navigate('/dashboard/memory');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="btn-ghost p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns, assets, memories..."
            value={searchQuery}
            onChange={handleSearch}
            className="input pl-10 w-80"
          />
          {searchResults && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-2 max-h-80 overflow-y-auto">
              {searchResults.campaigns?.map((c) => (
                <button key={c.id} onClick={() => goToResult('campaign', c.id)} className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <span className="badge badge-blue">Campaign</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
                </button>
              ))}
              {searchResults.experiments?.map((e) => (
                <button key={e.id} onClick={() => goToResult('experiment', e.id)} className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <span className="badge badge-yellow">Experiment</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{e.title}</span>
                </button>
              ))}
              {searchResults.memories?.map((m) => (
                <button key={m.id} onClick={() => goToResult('memory', m.id)} className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3">
                  <span className="badge badge-green">Memory</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{m.title}</span>
                </button>
              ))}
              {!searchResults.campaigns?.length && !searchResults.experiments?.length && !searchResults.memories?.length && (
                <div className="px-4 py-3 text-sm text-slate-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onToggleDark} className="btn-ghost p-2 rounded-lg">
          {dark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/dashboard/pricing')} className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${isPremium ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
              {isPremium ? 'Premium' : 'Essential'}
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user.name?.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
