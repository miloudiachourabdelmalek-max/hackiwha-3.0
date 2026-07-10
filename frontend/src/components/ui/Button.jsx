export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90',
    ghost: 'bg-transparent text-ink hover:bg-ink/5 border border-line',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
