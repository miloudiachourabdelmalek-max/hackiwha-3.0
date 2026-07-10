import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExperiences } from '../hooks/useExperiences';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Memory() {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const { data, isLoading } = useExperiences({ q: q || undefined, country: country || undefined });
  const experiences = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Marketing Memory</h1>
          <p className="text-sm text-ink/60">Every experiment your team has ever run, searchable</p>
        </div>
        <Link to="/memory/new"><Button>Log an experience</Button></Link>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Search title, lessons, mistakes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-line rounded-md px-3 py-2 text-sm flex-1"
        />
        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          className="border border-line rounded-md px-3 py-2 text-sm w-32"
        />
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-ink/50">Loading…</p>}
        {!isLoading && experiences.length === 0 && (
          <Card><p className="text-sm text-ink/50">Nothing logged yet for this filter. This is where "did we try this before" starts paying off — log your next campaign's outcome here.</p></Card>
        )}
        {experiences.map((exp) => {
          const isFailure = (exp.profitMicros !== null && exp.profitMicros < 0) || !!exp.mistakesMade;
          return (
            <Link key={exp.id} to={`/memory/${exp.id}`}>
              <Card className="hover:border-accent/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{exp.title}</div>
                    <div className="text-xs text-ink/50 mt-1">
                      {[exp.country, exp.category, exp.platform].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isFailure && <Badge tone="warn">Mistake logged</Badge>}
                    {exp.roas != null && <Badge tone={exp.roas >= 2 ? 'good' : 'default'}>ROAS {exp.roas}</Badge>}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
