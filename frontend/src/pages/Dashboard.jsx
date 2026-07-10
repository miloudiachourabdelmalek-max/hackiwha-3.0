import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCampaigns } from '../hooks/useCampaigns';
import { KpiCard, Card } from '../components/ui/Card';

function formatMoney(micros) {
  if (micros === undefined || micros === null) return '—';
  return `€${(Number(micros) / 1_000_000).toFixed(0)}`;
}

export default function Dashboard() {
  const { data, isLoading } = useCampaigns({ limit: 50 });
  const campaigns = data?.data || [];

  const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.reduce((s, m) => s + Number(m.costMicros), 0) || 0), 0);
  const avgRoas = campaigns.length
    ? (campaigns.reduce((sum, c) => sum + (c.metrics?.[0]?.roas || 0), 0) / campaigns.length).toFixed(2)
    : '—';

  const trendData = (campaigns[0]?.metrics || [])
    .slice()
    .reverse()
    .map((m) => ({ date: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), roas: m.roas }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink/60">Performance Max campaigns at a glance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active campaigns" value={isLoading ? '…' : campaigns.length} />
        <KpiCard label="Total spend (30d)" value={isLoading ? '…' : formatMoney(totalSpend)} />
        <KpiCard label="Avg ROAS" value={isLoading ? '…' : avgRoas} tone={avgRoas !== '—' && avgRoas < 2 ? 'warn' : 'good'} />
      </div>

      <Card>
        <h2 className="text-sm font-medium mb-4">ROAS trend</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="#E4E4E7" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip />
            <Line type="monotone" dataKey="roas" stroke="#4F46E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
