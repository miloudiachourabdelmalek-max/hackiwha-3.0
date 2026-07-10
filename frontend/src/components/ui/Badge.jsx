export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-ink/5 text-ink/70',
    warn: 'bg-warn/10 text-warn',
    good: 'bg-good/10 text-good',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tones[tone]}`}>{children}</span>;
}
