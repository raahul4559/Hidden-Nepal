import { cn } from "cn";

type PhotoCreditProps = {
  author: string;
  license?: string | null;
  sourceUrl?: string | null;
  className?: string;
};

/** License-required attribution, styled to sit quietly over an image. */
export function PhotoCredit({
  author,
  license,
  sourceUrl,
  className,
}: PhotoCreditProps) {
  const text = `Photo: ${author}${license ? `, ${license}` : ""}`;
  return (
    <span
      className={cn(
        "inline-block max-w-full truncate rounded-sm bg-navy/70 px-1.5 py-0.5 text-[0.6875rem] leading-tight text-ivory/90 backdrop-blur-sm",
        className,
      )}
    >
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer license"
          className="underline-offset-2 hover:underline focus-visible:outline-gold"
        >
          {text}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        text
      )}
    </span>
  );
}
