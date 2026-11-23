export function PageHeader({ label, title, subtitle }: { label?: string; title: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <header className="border-b border-line pb-10 pt-32 md:pb-14 md:pt-40">
      <div className="container-x">
        {label && <p className="mb-4 text-[13px] font-medium text-muted">{label}</p>}
        <h1 className="text-display max-w-4xl text-[40px] md:text-[72px]">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg text-ink-soft">{subtitle}</p>}
      </div>
    </header>
  );
}
