import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

const FLAGS = { DZ: '🇩🇿', FR: '🇫🇷', MA: '🇲🇦', TN: '🇹🇳', EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', TR: '🇹🇷' };

function KpiCard({ label, value, suffix, trend, icon, color }) {
  const isPositive = trend >= 0;
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}{suffix && <span className="text-lg text-slate-500 ml-1">{suffix}</span>}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: ${typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => { const r = await api.get('/dashboard/summary'); return r.data.data; },
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => { const r = await api.get('/dashboard/charts?days=30'); return r.data.data; },
  });

  const { data: topCampaigns } = useQuery({
    queryKey: ['dashboard-top'],
    queryFn: async () => { const r = await api.get('/dashboard/top-campaigns'); return r.data.data; },
  });

  const { data: countryData } = useQuery({
    queryKey: ['dashboard-countries'],
    queryFn: async () => { const r = await api.get('/dashboard/country-breakdown'); return r.data.data; },
  });

  const { data: aiSummary } = useQuery({
    queryKey: ['dashboard-ai'],
    queryFn: async () => { const r = await api.get('/dashboard/ai-summary'); return r.data.data; },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  const fmt = (n) => `$${Math.round(Number(n) || 0).toLocaleString()}`;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your marketing performance at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Spend" value={fmt(summary?.totalSpend)} trend={5.2} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-blue-500" />
        <KpiCard label="Total Revenue" value={fmt(summary?.totalRevenue)} trend={12.8} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="bg-teal-500" />
        <KpiCard label="Average ROAS" value={(Number(summary?.avgROAS) || 0).toFixed(2)} suffix="x" trend={8.1} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="bg-brand-500" />
        <KpiCard label="Conversions" value={Math.round(Number(summary?.totalConversions) || 0).toLocaleString()} trend={-3.5} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Revenue vs Spend (30 days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} fill="url(#colorSpend)" name="Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Performance by Country</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData || []} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="dark:opacity-20" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: '#94a3b8' }} width={35} tickFormatter={(v) => FLAGS[v] || v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#14b8a6" radius={[0, 6, 6, 0]} name="Revenue" />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 6, 6, 0]} name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Best Campaigns</h3>
          <div className="space-y-3">
            {topCampaigns?.best?.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{FLAGS[c.country]} {c.country} · {c.type}</p>
                </div>
                <span className={`badge ${Number(c.roas) >= 3 ? 'badge-green' : Number(c.roas) >= 2 ? 'badge-yellow' : 'badge-red'}`}>
                  {Number(c.roas).toFixed(1)}x
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Worst Campaigns</h3>
          <div className="space-y-3">
            {topCampaigns?.worst?.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{FLAGS[c.country]} {c.country} · {c.type}</p>
                </div>
                <span className={`badge ${Number(c.roas) >= 3 ? 'badge-green' : Number(c.roas) >= 2 ? 'badge-yellow' : 'badge-red'}`}>
                  {Number(c.roas).toFixed(1)}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-900/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Summary</h3>
              <p className="text-xs text-slate-500">Powered by AdMind</p>
            </div>
          </div>
          <p className="text-base font-medium text-slate-900 dark:text-white mb-3">{aiSummary.headline}</p>
          {aiSummary.highlights && (
            <ul className="space-y-2 mb-4">
              {aiSummary.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-brand-500 mt-0.5">•</span>{h}
                </li>
              ))}
            </ul>
          )}
          {aiSummary.recommendations && (
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommendations</p>
              <ul className="space-y-2">
                {aiSummary.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-teal-500">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
