import { getCategory } from "@/features/experiences/categories";
import { getTheme } from "@/features/experiences/themes";
import { getProvince } from "@/features/regions/provinces";
import { getSeason } from "@/features/seasons/seasons";

import type { DestinationSearch } from "./schemas";

/** "Himalayan lakes in Karnali for autumn" from the active filters. */
export function describeSearch(search: DestinationSearch): string {
  const what =
    (search.category && getCategory(search.category)?.label) ||
    (search.theme && getTheme(search.theme)?.label) ||
    "";
  const province = search.region ? getProvince(search.region) : undefined;
  const season = search.season ? getSeason(search.season) : undefined;
  const where = [search.district, province?.name].filter(Boolean).join(", ");
  return [
    what || (where || season ? "Destinations" : ""),
    where && `in ${where}`,
    season && `for ${season.label.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(" ");
}
