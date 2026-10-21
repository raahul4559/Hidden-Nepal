import { cn } from "cn";

type PhotoCreditProps = {
  author: string;
  license?: string | null;
  sourceUrl?: string | null;
  className?: string;
};

/** License-required attribution shown outside the photograph itself. */
export function PhotoCredit({
  author,
  license,
  sourceUrl,
  className,
}: PhotoCreditProps) {
  const text = `Photo: ${author}${license ? `, ${license}` : ""}`;
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer license"
          aria-label={text}
          className="rounded-sm underline underline-offset-2 hover:text-foreground"
        >
          Photo: {author}
          {license ? ` · ${license}` : ""}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        text
      )}
    </p>
  );
}
