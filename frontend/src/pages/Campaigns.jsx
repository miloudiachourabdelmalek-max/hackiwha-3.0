import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Card } from '../components/ui/Card';

function formatMoney(micros) {
  if (micros === undefined || micros === null) return '—';
  return `€${(Number(micros) / 1_000_000).toFixed(0)}`;
}

export default function Campaigns() {
  const [country, setCountry] = useState('');
  const { data, isLoading } = useCampaigns({ country: country || undefined });
  const campaigns = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Campaigns</h1>
          <p className="text-sm text-ink/60">Imported from Google Ads</p>
        </div>
        <input
          placeholder="Filter by country (e.g. FR)"
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          className="border border-line rounded-md px-3 py-2 text-sm w-56"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Budget</th>
              <th className="text-right px-4 py-3">Latest ROAS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={5}>Loading…</td></tr>
            )}
            {!isLoading && campaigns.length === 0 && (
              <tr><td className="px-4 py-4 text-ink/50" colSpan={5}>No campaigns match this filter.</td></tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t border-line hover:bg-ink/[0.02]">
                <td className="px-4 py-3">
                  <Link to={`/campaigns/${c.id}`} className="text-accent hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-3">{c.country || '—'}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3 text-right metric">{formatMoney(c.budgetMicros)}</td>
                <td className="px-4 py-3 text-right metric">{c.metrics?.[0]?.roas?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
