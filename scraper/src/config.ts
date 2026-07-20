// Scientia academic-year URL segment. Rollover (e.g. to 'sws_2026') breaks the
// scrape visibly — navigation fails — and fixing it is this one constant.
export const ACADEMIC_YEAR_SEGMENT = 'sws_2025';
export const BASE_URL = `https://sws-van.as.it.ubc.ca/${ACADEMIC_YEAR_SEGMENT}/`;

// Timetable day window; outside it rooms read as closed.
export const DAY_START = '07:00';
export const DAY_END = '22:00';

// Scientia location names we have explicitly decided not to map (reviewed by a
// human). Anything unmapped and NOT listed here fails the run loudly.
export const UNMAPPABLE_LOCATIONS: string[] = [];
