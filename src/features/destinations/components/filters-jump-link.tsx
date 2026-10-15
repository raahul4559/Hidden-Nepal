import { SlidersHorizontal } from "lucide-react";

/** Small-screen shortcut to the filter form, which follows the results there. */
export function FiltersJumpLink({ count }: { count: number }) {
  return (
    <a
      href="#filters"
      className="inline-flex h-10 items-center gap-2 rounded-md border border-input/50 bg-white px-4 text-sm font-semibold lg:hidden"
    >
      <SlidersHorizontal aria-hidden className="size-4 text-himalaya" />
      Filters{count ? ` (${count})` : ""}
    </a>
  );
}
