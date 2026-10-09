// Pure parsing for hours.library.ubc.ca. No network: libraryClient.ts fetches the HTML,
// this turns it into the 7 actual days a branch is open this week. Anything that does
// not match a known format throws, so the caller keeps that branch's previous hours
// instead of storing a guess.

export interface DayRow {
  dayOfWeek: number; // 0 = Sunday, matching JS getDay() on the read side
  opensAt: string; // "HH:MM"
  closesAt: string; // "HH:MM"; earlier than opensAt means the day runs past midnight
}

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

type MonthDay = { month: number; day: number };
type DateRange = { from: MonthDay; to: MonthDay };
type Hours = { opensAt: string; closesAt: string } | 'closed';

interface WeeklyBlock {
  period: DateRange | null; // from the heading, e.g. "Regular Hours (Sep 1-Dec 22)"; null = no range given
  days: Map<number, Hours>;
}

interface DatedRow {
  range: DateRange;
  hours: Hours;
}

export interface HoursTable {
  weekly: WeeklyBlock[];
  dated: DatedRow[];
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function cleanText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&ndash;|&#8211;|–/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The main page embeds one calendar per branch; its Prev/Next buttons carry the numeric
 * `location_id` that calendar.inc.php needs to load another month.
 * e.g. `<section id="calendar_koerner" ...> ... <button class="prev-month" value="2">`
 */
export function parseBranchIds(mainPageHtml: string): Map<string, string> {
  const ids = new Map<string, string>();
  const re = /<section id="calendar_(\w+)"[\s\S]*?class="prev-month" value="(\d+)"/g;
  for (const match of mainPageHtml.matchAll(re)) {
    ids.set(match[1], match[2]);
  }
  return ids;
}

function weekdayIndex(name: string): number {
  const index = WEEKDAYS.indexOf(name.trim().slice(0, 3).toLowerCase());
  if (index === -1) throw new Error(`unknown weekday "${name}"`);
  return index;
}

/** "Mon-Thu", "Fri", "Sat-Sun", "Mon, Wed" → weekday indexes. Wrapping ranges like "Fri-Mon" are allowed. */
export function parseWeekdays(text: string): number[] {
  const days: number[] = [];
  for (const part of text.split(',')) {
    const [start, end] = part.split('-');
    const from = weekdayIndex(start);
    const to = end === undefined ? from : weekdayIndex(end);
    for (let d = from; ; d = (d + 1) % 7) {
      days.push(d);
      if (d === to) break;
    }
  }
  return days;
}

function parseMonthDay(text: string, fallbackMonth?: number): MonthDay {
  const match = /^(?:([a-z]{3})[a-z]*\.?\s+)?(\d{1,2})$/i.exec(text.trim());
  if (!match) throw new Error(`unknown date "${text}"`);
  const month = match[1] ? MONTHS.indexOf(match[1].toLowerCase()) + 1 : fallbackMonth;
  if (!month) throw new Error(`unknown date "${text}"`);
  return { month, day: Number(match[2]) };
}

/** "Oct 12", "Dec 23-24", "Dec 25-Jan 2", "Sep 1-Dec 22". The site gives no year. */
export function parseDateRange(text: string): DateRange {
  const [start, end] = text.split('-');
  const from = parseMonthDay(start);
  const to = end === undefined ? from : parseMonthDay(end, from.month);
  return { from, to };
}

function toClock(hourText: string, minuteText: string | undefined, meridiem: string): string {
  let hour = Number(hourText);
  if (hour < 1 || hour > 12) throw new Error(`hour out of range "${hourText}"`);
  if (hour === 12) hour = 0;
  if (meridiem.toLowerCase() === 'pm') hour += 12;
  return `${String(hour).padStart(2, '0')}:${minuteText ?? '00'}`;
}

/** "9am - 9pm", "8:30am - 6pm", "6am - 12am", "Closed* (Thanksgiving)". */
export function parseHours(text: string): Hours {
  const cleaned = text
    .replace(/\(.*?\)/g, '')
    .replace(/\*/g, '')
    .trim();
  if (/^closed$/i.test(cleaned)) return 'closed';

  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(cleaned);
  if (!match) throw new Error(`unknown hours "${text}"`);
  return {
    opensAt: toClock(match[1], match[2], match[3]),
    closesAt: toClock(match[4], match[5], match[6]),
  };
}

function isWeekdayLabel(text: string): boolean {
  try {
    parseWeekdays(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the `<section class="hours-table">` of a month fragment. Each `<h6>` heading is
 * followed by a `<dl>` whose `<dt>` labels are either weekdays (a recurring block such as
 * "Regular Hours (Sep 1-Dec 22)") or dates (Holiday / Exception Hours).
 */
export function parseHoursTable(html: string): HoursTable {
  const section = /<section class="hours-table">([\s\S]*?)<\/section>/.exec(html)?.[1];
  if (!section) throw new Error('no hours-table section');

  const table: HoursTable = { weekly: [], dated: [] };
  const blockRe = /<h6[^>]*>([\s\S]*?)<\/h6>\s*<dl[^>]*>([\s\S]*?)<\/dl>/g;

  for (const [, headingHtml, listHtml] of section.matchAll(blockRe)) {
    const entries = [...listHtml.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)].map(
      ([, dt, dd]) => ({ label: cleanText(dt), value: cleanText(dd) }),
    );
    if (entries.length === 0) continue;

    if (entries.every((e) => isWeekdayLabel(e.label))) {
      const periodText = /\(([^)]*\d[^)]*)\)/.exec(cleanText(headingHtml))?.[1];
      const days = new Map<number, Hours>();
      for (const entry of entries) {
        const hours = parseHours(entry.value);
        for (const day of parseWeekdays(entry.label)) days.set(day, hours);
      }
      table.weekly.push({ period: periodText ? parseDateRange(periodText) : null, days });
    } else {
      for (const entry of entries) {
        table.dated.push({ range: parseDateRange(entry.label), hours: parseHours(entry.value) });
      }
    }
  }

  if (table.weekly.length === 0 && table.dated.length === 0) throw new Error('hours-table has no hours');
  return table;
}

const ordinal = (md: MonthDay) => md.month * 100 + md.day;

function rangeCovers(range: DateRange, date: CalendarDate): boolean {
  const x = ordinal(date);
  const from = ordinal(range.from);
  const to = ordinal(range.to);
  // A range like "Dec 25-Jan 2" wraps the year end.
  return from <= to ? x >= from && x <= to : x >= from || x <= to;
}

function rangeLength(range: DateRange | null): number {
  if (!range) return Infinity;
  const from = range.from.month * 31 + range.from.day;
  const to = range.to.month * 31 + range.to.day;
  return to >= from ? to - from : to + 12 * 31 - from;
}

export function weekdayOf(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/**
 * Hours for one date: a dated Holiday/Exception row wins; otherwise the recurring block
 * whose period covers the date (the narrowest one if several do, e.g. an exam block
 * inside the term). A date no rule covers throws rather than guessing.
 */
export function resolveDay(table: HoursTable, date: CalendarDate): Hours {
  const dated = table.dated.filter((row) => rangeCovers(row.range, date));
  if (dated.length > 0) {
    const first = JSON.stringify(dated[0].hours);
    if (dated.some((row) => JSON.stringify(row.hours) !== first)) {
      throw new Error(`conflicting dated hours for ${date.month}/${date.day}`);
    }
    return dated[0].hours;
  }

  const blocks = table.weekly
    .filter((block) => !block.period || rangeCovers(block.period, date))
    .sort((a, b) => rangeLength(a.period) - rangeLength(b.period));
  if (blocks.length === 0) throw new Error(`no hours rule covers ${date.month}/${date.day}`);

  const hours = blocks[0].days.get(weekdayOf(date));
  if (hours === undefined) throw new Error(`weekday not listed for ${date.month}/${date.day}`);
  return hours;
}

export const monthKey = (date: { year: number; month: number }) => `${date.year}-${date.month}`;

/**
 * The rows to store for a branch: one per open day of `dates`, each resolved against the
 * hours table of that date's own month. Closed days produce no row.
 */
export function buildWeekRows(tablesByMonth: Map<string, HoursTable>, dates: CalendarDate[]): DayRow[] {
  const rows: DayRow[] = [];
  for (const date of dates) {
    const table = tablesByMonth.get(monthKey(date));
    if (!table) throw new Error(`no hours table loaded for ${monthKey(date)}`);
    const hours = resolveDay(table, date);
    if (hours !== 'closed') rows.push({ dayOfWeek: weekdayOf(date), ...hours });
  }
  return rows;
}

export interface CalendarWeek {
  start: string; // the week's Sunday as "YYYY-MM-DD", the value stored in week_start
  dates: CalendarDate[]; // Sunday..Saturday
}

const DAY_MS = 86_400_000;

function weekFrom(sundayUtcMs: number): CalendarWeek {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sundayUtcMs + i * DAY_MS);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  });
  const pad = (n: number) => String(n).padStart(2, '0');
  return { start: `${dates[0].year}-${pad(dates[0].month)}-${pad(dates[0].day)}`, dates };
}

/** This Sunday–Saturday week and the next one, by the calendar date in `timeZone`. */
export function calendarWeeks(
  now: Date,
  timeZone = 'America/Vancouver',
): { thisWeek: CalendarWeek; nextWeek: CalendarWeek } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const sunday = today - new Date(today).getUTCDay() * DAY_MS;
  return { thisWeek: weekFrom(sunday), nextWeek: weekFrom(sunday + 7 * DAY_MS) };
}

export interface ResolvedWeeks {
  thisRows: DayRow[];
  nextRows: DayRow[] | null; // null when next week could not be resolved
  nextError: string | null;
}

/**
 * This week must resolve or the branch fails (throws). Next week is best effort: near
 * the end of a published period the site often has no rule for it yet, which should not
 * stop this week's hours from being saved.
 */
export function resolveWeeks(
  tablesByMonth: Map<string, HoursTable>,
  thisWeek: CalendarWeek,
  nextWeek: CalendarWeek,
): ResolvedWeeks {
  const thisRows = buildWeekRows(tablesByMonth, thisWeek.dates);
  try {
    return { thisRows, nextRows: buildWeekRows(tablesByMonth, nextWeek.dates), nextError: null };
  } catch (err) {
    return { thisRows, nextRows: null, nextError: err instanceof Error ? err.message : String(err) };
  }
}
