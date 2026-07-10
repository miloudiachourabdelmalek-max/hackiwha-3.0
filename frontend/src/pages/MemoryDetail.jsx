import { useParams } from 'react-router-dom';
import { useExperience } from '../hooks/useExperiences';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-ink/50 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export default function MemoryDetail() {
  const { id } = useParams();
  const { data: exp, isLoading } = useExperience(id);

  if (isLoading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (!exp) return <p className="text-sm text-ink/50">Not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex gap-2 mb-2">
          {exp.mistakesMade && <Badge tone="warn">Mistake logged</Badge>}
          {exp.tags?.map((t) => <Badge key={t}>{t}</Badge>)}
        </div>
        <h1 className="text-xl font-semibold">{exp.title}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {[exp.country, exp.category, exp.platform].filter(Boolean).join(' · ')} · logged by {exp.author?.name}
        </p>
      </div>

      <Card className="grid grid-cols-4 gap-4">
        <div><div className="text-xs text-ink/50">ROAS</div><div className="metric text-lg">{exp.roas ?? '—'}</div></div>
        <div><div className="text-xs text-ink/50">CPA</div><div className="metric text-lg">{exp.cpaMicros ? `€${(Number(exp.cpaMicros) / 1e6).toFixed(2)}` : '—'}</div></div>
        <div><div className="text-xs text-ink/50">Spend</div><div className="metric text-lg">{exp.spendMicros ? `€${(Number(exp.spendMicros) / 1e6).toFixed(0)}` : '—'}</div></div>
        <div><div className="text-xs text-ink/50">Profit</div><div className={`metric text-lg ${exp.profitMicros < 0 ? 'text-warn' : 'text-good'}`}>{exp.profitMicros ? `€${(Number(exp.profitMicros) / 1e6).toFixed(0)}` : '—'}</div></div>
      </Card>

      <Card className="space-y-4">
        <Field label="Hypothesis" value={exp.hypothesis} />
        <Field label="Description" value={exp.description} />
        <Field label="Result" value={exp.result} />
        <Field label="Lessons learned" value={exp.lessonsLearned} />
        <Field label="Mistakes made" value={exp.mistakesMade} />
        <Field label="Recommendations" value={exp.recommendations} />
      </Card>
    </div>
  );
}
