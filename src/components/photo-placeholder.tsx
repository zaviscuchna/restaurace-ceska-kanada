// Vizuálně čistý placeholder pro fotku, kterou dodá klient.
// Až přijde reálný snímek, nahraď tuhle komponentu <Image>.

export function PhotoPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,154,43,0.08),transparent_60%)]"
      />
      <div className="relative flex flex-col items-center gap-3 px-6 py-10 text-center">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary/70"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.3" />
          <path d="m4 17 5-4.5 4 3.2L16.5 12 20 15" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <span className="text-xs uppercase tracking-[0.22em] text-muted">{label}</span>
      </div>
    </div>
  );
}
