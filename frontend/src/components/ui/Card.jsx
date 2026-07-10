export function Card({ children, className = '' }) {
  return <div className={`bg-white border border-line rounded-lg p-5 ${className}`}>{children}</div>;
}

export function KpiCard({ label, value, sublabel, tone = 'default' }) {
  const toneClass = tone === 'warn' ? 'text-warn' : tone === 'good' ? 'text-good' : 'text-ink';
  return (
    <Card>
      <div className="text-sm text-ink/60">{label}</div>
      <div className={`metric text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-ink/50 mt-1">{sublabel}</div>}
    </Card>
  );
}
