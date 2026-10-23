export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-balance text-3xl leading-[1.05] tracking-[-0.04em] sm:text-[40px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-pretty text-[14px] leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
