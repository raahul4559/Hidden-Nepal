import { cn } from "cn";

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
  /** Heading level; sections on a page use h2 by default. */
  as?: "h1" | "h2";
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "start",
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="eyebrow text-muted-foreground">
        <span aria-hidden className="mr-3 inline-block h-px w-8 bg-gold align-middle" />
        {eyebrow}
      </p>
      <Heading
        id={id}
        className="mt-4 font-serif text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-4xl lg:text-5xl"
      >
        {title}
      </Heading>
      {intro ? (
        <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          {intro}
        </p>
      ) : null}
    </div>
  );
}
