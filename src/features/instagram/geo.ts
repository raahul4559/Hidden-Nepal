/**
 * Geographic trust checks for manually supplied places.
 *
 * The project does not run a geocoder: coordinates must come from a named,
 * reliable source and are checked against Nepal's bounding box before they
 * enter the database. That is deliberately stricter than guessing a location
 * from an Instagram tag.
 */

const RELIABLE_GEO_HOSTS = [
  "openstreetmap.org",
  "nominatim.openstreetmap.org",
  "wikidata.org",
  "ntb.gov.np",
  "unesco.org",
  "whc.unesco.org",
] as const;

const NEPAL = {
  minLatitude: 26.3,
  maxLatitude: 30.5,
  minLongitude: 80.0,
  maxLongitude: 88.3,
} as const;

export function isReliableGeoSource(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return (
      RELIABLE_GEO_HOSTS.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`),
      ) ||
      host === "gov.np" ||
      host.endsWith(".gov.np")
    );
  } catch {
    return false;
  }
}

export function coordinatesInNepal(latitude: number, longitude: number): boolean {
  return (
    latitude >= NEPAL.minLatitude &&
    latitude <= NEPAL.maxLatitude &&
    longitude >= NEPAL.minLongitude &&
    longitude <= NEPAL.maxLongitude
  );
}

export { NEPAL as NEPAL_GEO_BOUNDS };
