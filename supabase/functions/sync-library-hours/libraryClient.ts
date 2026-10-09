import { parseBranchIds } from './parseHours.ts';

const BASE_URL = 'https://hours.library.ubc.ca';
const REQUEST_TIMEOUT_MS = 20_000;
// Pause before each month request; the whole run is at most ~18 small requests.
const REQUEST_DELAY_MS = 300;

/** Branch id (e.g. `koerner`) → numeric location_id, read fresh from the main page each run. */
export async function fetchBranchIds(): Promise<Map<string, string>> {
  const response = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Failed to load ${BASE_URL}/: ${response.status}`);

  const ids = parseBranchIds(await response.text());
  if (ids.size === 0) throw new Error(`No branch calendars found on ${BASE_URL}/ (page layout changed?)`);
  return ids;
}

/**
 * Loads one branch's month fragment the same way the site's Prev/Next buttons do
 * (POST includes/calendar.inc.php). Each fragment has its own hours-table, with that
 * month's Holiday/Exception rows.
 */
export async function fetchMonth(locationId: string, year: number, month: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  const response = await fetch(`${BASE_URL}/includes/calendar.inc.php`, {
    method: 'POST',
    body: new URLSearchParams({ location_id: locationId, year: String(year), month: String(month) }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`calendar.inc.php ${locationId} ${year}-${month}: ${response.status}`);
  return response.text();
}
