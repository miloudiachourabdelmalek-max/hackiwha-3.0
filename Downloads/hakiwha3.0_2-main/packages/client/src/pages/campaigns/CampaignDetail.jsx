import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

const FLAGS = { DZ: '🇩🇿', FR: '🇫🇷', MA: '🇲🇦', TN: '🇹🇳', EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', TR: '🇹🇷' };

function MetricBox({ label, value, sub }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => { const r = await api.get(`/campaigns/${id}`); return r.data.data; },
  });

  const { data: metrics } = useQuery({
    queryKey: ['campaign-metrics', id],
    queryFn: async () => { const r = await api.get(`/campaigns/${id}/metrics?days=30`); return r.data.data; },
  });

  const { data: analysis, isLoading: analysisLoading, refetch: analyze } = useQuery({
    queryKey: ['campaign-analysis', id],
    queryFn: async () => { const r = await api.post(`/ai/analyze-campaign/${id}`); return r.data.data; },
    enabled: false,
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}</div>;
  if (!campaign) return <div className="text-center py-20 text-slate-500">Campaign not found</div>;

  const t = campaign.totals || {};
  const a = campaign.averages || {};

  const assetTypeIcon = (type) => {
    const icons = {
      HEADLINE: 'H', LONG_HEADLINE: 'LH', DESCRIPTION: 'D', IMAGE: '🖼', VIDEO: '▶', LOGO: '◎', LANDING_PAGE: '🔗', PRODUCT: '📦',
    };
    return icons[type] || '•';
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/campaigns" className="btn-ghost p-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm">{FLAGS[campaign.country]} {campaign.country}</span>
            <span className={`badge ${campaign.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>{campaign.status}</span>
            <span className="badge badge-gray">{campaign.type?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <MetricBox label="Budget" value={`$${Number(t.cost || 0).toLocaleString()}`} />
          <MetricBox label="Revenue" value={`$${Number(t.revenue || 0).toLocaleString()}`} />
          <MetricBox label="ROAS" value={`${Number(a.roas || 0).toFixed(2)}x`} />
          <MetricBox label="CPA" value={`$${Number(a.cpa || 0).toFixed(2)}`} />
          <MetricBox label="CTR" value={`${Number(a.ctr || 0).toFixed(2)}%`} />
          <MetricBox label="Clicks" value={Number(t.clicks || 0).toLocaleString()} />
          <MetricBox label="Conversions" value={Math.round(Number(t.conversions || 0)).toLocaleString()} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Performance Trend</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={(metrics || []).map((m) => ({ ...m, date: m.date?.split('T')[0] }))}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#14b8a6" fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Campaign Analysis</h3>
          <button onClick={() => analyze()} disabled={analysisLoading} className="btn-primary text-sm">
            {analysisLoading ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        </div>
        {analysis && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${analysis.analysis?.grade === 'A' ? 'text-teal-500' : analysis.analysis?.grade === 'B' || analysis.analysis?.grade === 'B+' ? 'text-cyan-500' : analysis.analysis?.grade === 'C' ? 'text-amber-500' : 'text-red-500'}`}>
                {analysis.analysis?.grade}
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{analysis.analysis?.headline}</p>
                <p className="text-sm text-slate-500">{analysis.analysis?.summary}</p>
              </div>
            </div>
            {analysis.analysis?.strengths?.length > 0 && (
              <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">Strengths</p>
                <ul className="space-y-1">{analysis.analysis.strengths.map((s, i) => <li key={i} className="text-sm text-teal-600 dark:text-teal-400">✓ {s}</li>)}</ul>
              </div>
            )}
            {analysis.analysis?.weaknesses?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Weaknesses</p>
                <ul className="space-y-1">{analysis.analysis.weaknesses.map((w, i) => <li key={i} className="text-sm text-red-600 dark:text-red-400">✗ {w}</li>)}</ul>
              </div>
            )}
            {analysis.analysis?.recommendations?.length > 0 && (
              <div className="bg-brand-50 dark:bg-brand-900/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider mb-2">Recommendations</p>
                <ul className="space-y-1">{analysis.analysis.recommendations.map((r, i) => <li key={i} className="text-sm text-brand-600 dark:text-brand-400">→ {r}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        {!analysis && !analysisLoading && (
          <p className="text-sm text-slate-400 text-center py-8">Click "Analyze with AI" to get intelligent insights about this campaign</p>
        )}
      </div>

      {campaign.assetGroups?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Assets ({campaign.totalAssets || 0} total)</h3>
          <div className="space-y-4">
            {campaign.assetGroups.map((ag) => (
              <div key={ag.id}>
                {ag.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500">
                      {assetTypeIcon(asset.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white truncate">{asset.content}</p>
                      <p className="text-xs text-slate-400">{asset.type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
