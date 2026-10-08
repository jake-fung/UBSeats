// B.C. stays on UTC-7 year-round from 2026-11-01. Older tzdata still falls back to -8,
// which would write every classroom booking an hour off, so refuse to run on it.
const MIN_TZDATA = '2026c';

export function assertTzdata(actual: string | undefined): void {
  // tzdata versions are a year plus one letter, so string order is release order.
  if (!actual || actual < MIN_TZDATA) {
    throw new Error(
      `Outdated time zone data: tzdata ${actual ?? 'unknown'} < ${MIN_TZDATA}. ` +
        'B.C. is UTC-7 year-round from 2026-11-01; run the scraper with the pinned Node (npm run scrape).',
    );
  }
}
