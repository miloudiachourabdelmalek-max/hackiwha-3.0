import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';

const PRODUCTS = [
  'Running Shoes', 'Smart Watch', 'Wireless Earbuds', 'Backpack',
  'Sunglasses', 'Fitness Tracker', 'Winter Jacket', 'Sport Watch',
  'Laptop Stand', 'Phone Case',
];
const COUNTRIES = [
  { code: 'DZ', flag: '🇩🇿', name: 'Algeria' }, { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'MA', flag: '🇲🇦', name: 'Morocco' }, { code: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'EG', flag: '🇪🇬', name: 'Egypt' }, { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE' }, { code: 'TR', flag: '🇹🇷', name: 'Turkey' },
];
const GOALS = ['Conversions', 'ROAS', 'Brand Awareness', 'Traffic'];

export default function CampaignAdvisor() {
  const [form, setForm] = useState({ product: '', country: '', budget: 5000, goal: 'Conversions' });
  const [result, setResult] = useState(null);

  const recommend = useMutation({
    mutationFn: async (data) => {
      const r = await api.post('/ai/recommend', data);
      return r.data.data;
    },
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product || !form.country) return;
    setResult(null);
    recommend.mutate(form);
  };

  const countryName = COUNTRIES.find((c) => c.code === result?.country)?.name || result?.country;
  const countryFlag = COUNTRIES.find((c) => c.code === result?.country)?.flag || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200 dark:shadow-teal-900/30">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Campaign Advisor</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tell us about your next campaign and get data-driven recommendations</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product</label>
            <select className="select w-full" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
              <option value="">Select a product</option>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country</label>
            <select className="select w-full" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required>
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Budget: <span className="text-teal-500 font-bold">${Number(form.budget).toLocaleString()}</span></label>
            <input type="range" min="500" max="50000" step="500" value={form.budget}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>$500</span><span>$50,000</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Goal</label>
            <select className="select w-full" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={recommend.isPending} className="w-full mt-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {recommend.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Analyzing your data and generating recommendations...
            </span>
          ) : 'Get AI Recommendations'}
        </button>
        {recommend.isError && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to generate recommendations. Please make sure you have data and try again.</p>
          </div>
        )}
      </form>

      {result && (
        <div className="space-y-6 animate-slide-up">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recommendations for {result.product} in {countryFlag} {countryName}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-3">🎯 Recommended Headlines</h3>
                <ul className="space-y-2">{result.recommendations?.assets?.headlines?.map((h, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3">{h}</li>)}</ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3">📝 Descriptions</h3>
                <ul className="space-y-2">{result.recommendations?.assets?.descriptions?.map((d, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3">{d}</li>)}</ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3">🖼 Creative Assets</h3>
                <ul className="space-y-2">{result.recommendations?.assets?.images?.map((img, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3">{img}</li>)}</ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3">👥 Target Audience</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">{result.recommendations?.audience}</p>
                {result.recommendations?.creatives && (
                  <>
                    <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Best Creative Formats</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{result.recommendations.creatives}</p>
                  </>
                )}
                {result.recommendations?.language && (
                  <>
                    <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Language</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{result.recommendations.language}</p>
                  </>
                )}
                <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Expected ROAS</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{result.recommendations?.expectedROAS}</p>
                <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Budget Range</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">{result.recommendations?.budgetRange}</p>
              </div>
            </div>

            {result.recommendations?.goalAdvice && (
              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-5 mt-6">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">📋 Goal Strategy ({result.goal})</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">{result.recommendations.goalAdvice}</p>
              </div>
            )}

            {result.recommendations?.tips?.length > 0 && (
              <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-xl p-5 mt-4">
                <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 mb-3">💡 Country-Specific Tips</h3>
                <ul className="space-y-1.5">{result.recommendations.tips.map((t, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">• {t}</li>)}</ul>
              </div>
            )}

            {result.recommendations?.warnings?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 mt-4">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">⚠️ Warnings from Your Data</h3>
                <ul className="space-y-2">{result.recommendations.warnings.map((w, i) => <li key={i} className="text-sm text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 rounded-lg p-3">• {w}</li>)}</ul>
              </div>
            )}

            {result.recommendations?.pastInsights?.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-5 mt-4">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">✅ Past Wins in This Market</h3>
                <ul className="space-y-2">{result.recommendations.pastInsights.map((p, i) => <li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 rounded-lg p-3">• {p}</li>)}</ul>
              </div>
            )}

            {result.recommendations?.memoryInsights?.length > 0 && (
              <div className="bg-brand-50 dark:bg-brand-900/10 rounded-xl p-5 mt-4">
                <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-3">🧠 Relevant Marketing Memory</h3>
                <ul className="space-y-2">{result.recommendations.memoryInsights.map((m, i) => <li key={i} className="text-sm text-brand-600 dark:text-brand-400">• {m}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
