import { cn } from "cn";

/** Navy opening band for inner pages; leaves room for the overlaid header. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("surface-dark pt-32 pb-14 sm:pt-36 sm:pb-16", className)}>
      <div className="container-page">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] font-normal tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-ivory/80">
            {intro}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
