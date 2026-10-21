import { suggestDestinations } from "@/features/destinations/queries";
import { json } from "@/lib/http";

const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length > MAX_QUERY_LENGTH) {
    return json({ error: "Search text is too long" }, 400);
  }
  if (query.length < MIN_QUERY_LENGTH) {
    return json({ suggestions: [] });
  }

  const result = await suggestDestinations(query);
  if (result.status !== "ok") {
    return json({ error: "Suggestions are temporarily unavailable" }, 503);
  }

  return json({ suggestions: result.suggestions });
}
