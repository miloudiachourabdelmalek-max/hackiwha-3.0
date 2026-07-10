import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateExperience, useSimilarExperiences } from '../hooks/useExperiences';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function MemoryNew() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { platform: 'google_ads' },
  });
  const createExperience = useCreateExperience();

  // Watched live so the similarity panel updates as the user types — this is the
  // "did we already test this" moment, surfaced before the campaign is even launched.
  const country = watch('country');
  const category = watch('category');
  const platform = watch('platform');
  const budget = watch('budgetMicros');

  const { data: similar, isLoading: loadingSimilar } = useSimilarExperiences({
    country,
    category,
    platform,
    budgetMicros: budget ? Number(budget) * 1_000_000 : undefined,
  });

  async function onSubmit(values) {
    const payload = {
      ...values,
      budgetMicros: values.budgetMicros ? Number(values.budgetMicros) * 1_000_000 : undefined,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: 'draft',
    };
    await createExperience.mutateAsync(payload);
    navigate('/memory');
  }

  return (
    <div className="grid grid-cols-3 gap-6 max-w-6xl">
      <form onSubmit={handleSubmit(onSubmit)} className="col-span-2 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Log a marketing experience</h1>
          <p className="text-sm text-ink/60">This becomes searchable company knowledge — future you (or a teammate) will thank you.</p>
        </div>

        <Card className="space-y-3">
          <input {...register('title', { required: true })} placeholder="Title" className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <input {...register('country')} placeholder="Country (e.g. FR)" className="border border-line rounded-md px-3 py-2 text-sm" />
            <input {...register('category')} placeholder="Category (e.g. Shoes)" className="border border-line rounded-md px-3 py-2 text-sm" />
            <input {...register('budgetMicros')} type="number" placeholder="Budget (€)" className="border border-line rounded-md px-3 py-2 text-sm" />
          </div>
          <textarea {...register('hypothesis')} placeholder="Hypothesis — what do you expect to happen and why?" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <textarea {...register('description')} placeholder="Description of the setup" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <input {...register('tags')} placeholder="Tags, comma separated" className="w-full border border-line rounded-md px-3 py-2 text-sm" />
        </Card>

        <Card className="space-y-3">
          <div className="text-sm font-medium text-ink/70">Outcome (fill in once it's run)</div>
          <div className="grid grid-cols-3 gap-3">
            <input {...register('roas')} type="number" step="0.1" placeholder="ROAS" className="border border-line rounded-md px-3 py-2 text-sm" />
            <input {...register('spendMicros')} type="number" placeholder="Spend (€)" className="border border-line rounded-md px-3 py-2 text-sm" />
            <input {...register('profitMicros')} type="number" placeholder="Profit (€, negative if loss)" className="border border-line rounded-md px-3 py-2 text-sm" />
          </div>
          <textarea {...register('result')} placeholder="What actually happened" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <textarea {...register('lessonsLearned')} placeholder="Lessons learned" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <textarea {...register('mistakesMade')} placeholder="Mistakes made (this is what future-you gets warned about)" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          <textarea {...register('recommendations')} placeholder="Recommendations for next time" rows={2} className="w-full border border-line rounded-md px-3 py-2 text-sm" />
        </Card>

        <Button type="submit" disabled={createExperience.isPending}>
          {createExperience.isPending ? 'Saving…' : 'Save experience'}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="text-sm font-medium text-ink/70 sticky top-0">
          {country || category ? 'Similar past experiences' : 'Fill in country or category to check history'}
        </div>
        {loadingSimilar && <p className="text-sm text-ink/50">Checking history…</p>}
        {similar?.length === 0 && (country || category) && (
          <Card><p className="text-sm text-ink/50">No matching history found — this looks like genuinely new territory.</p></Card>
        )}
        {similar?.map((exp) => (
          <Card key={exp.id} className={exp._isWarning ? 'border-warn/40' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm">{exp.title}</div>
              {exp._isWarning && <Badge tone="warn">Warning</Badge>}
            </div>
            <div className="text-xs text-ink/50 mt-1">{[exp.country, exp.category].filter(Boolean).join(' · ')} · ROAS {exp.roas ?? '—'}</div>
            {exp.mistakesMade && <p className="text-xs text-warn mt-2">{exp.mistakesMade}</p>}
            {exp.recommendations && <p className="text-xs text-ink/70 mt-1">→ {exp.recommendations}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
