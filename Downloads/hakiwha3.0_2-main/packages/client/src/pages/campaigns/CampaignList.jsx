import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

const FLAGS = { DZ: '🇩🇿', FR: '🇫🇷', MA: '🇲🇦', TN: '🇹🇳', EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', TR: '🇹🇷' };
const STATUS_COLORS = { ACTIVE: 'badge-green', PAUSED: 'badge-yellow', COMPLETED: 'badge-blue', ARCHIVED: 'badge-gray' };

export default function CampaignList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ country: '', status: '', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.country) params.set('country', filters.country);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      params.set('page', filters.page);
      params.set('limit', '20');
      const r = await api.get(`/campaigns?${params}`);
      return r.data;
    },
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Campaign Explorer</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View and analyze your Google Ads campaigns</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search campaigns..."
          className="input w-60"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        />
        <select className="select" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, page: 1 })}>
          <option value="">All Countries</option>
          {Object.entries(FLAGS).map(([code, flag]) => (
            <option key={code} value={code}>{flag} {code}</option>
          ))}
        </select>
        <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Campaign</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Country</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Budget</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">ROAS</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/dashboard/campaigns/${c.id}`)} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.type?.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{FLAGS[c.country]} {c.country}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-700 dark:text-slate-300">${Number(c.totalBudget || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`badge ${Number(c.latestROAS) >= 3 ? 'badge-green' : Number(c.latestROAS) >= 2 ? 'badge-yellow' : 'badge-red'}`}>
                        {Number(c.latestROAS || 0).toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{Number(c.latestCTR || 0).toFixed(2)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.pagination && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500">Showing {data.data.length} of {data.pagination.total} campaigns</p>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn-secondary text-sm px-3 py-1.5">Prev</button>
                <button disabled={data.data.length < 20} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn-secondary text-sm px-3 py-1.5">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
