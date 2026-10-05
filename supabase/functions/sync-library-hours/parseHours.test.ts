import { assertEquals, assertThrows } from 'jsr:@std/assert';
import {
  buildWeekRows,
  parseBranchIds,
  parseDateRange,
  parseHours,
  parseHoursTable,
  parseWeekdays,
  calendarWeeks,
  resolveDay,
  resolveWeeks,
} from './parseHours.ts';

// Real hours-table markup from hours.library.ubc.ca, fetched 2026-10-04.
// Koerner, October 2026 (main page):
const KOERNER_OCT = `<section class="hours-table"> <h6><span class="hours-category regular"></span>Regular Hours (Sep 1-Dec 22)</h6><dl class="regular"><dt>Mon-Thu</dt><dd>8am - 8pm</dd><dt>Fri</dt><dd>8am - 6pm</dd><dt>Sat-Sun</dt><dd>11am - 6pm</dd></dl><h6><span class="hours-category holiday"></span>Holiday Hours</h6><dl class="holiday"><dt>Oct 12</dt><dd>Closed* (Thanksgiving)</dd></dl> </section>`;
// Asian Library, December 2026 (calendar.inc.php): the regular period ends Dec 22 and
// holiday ranges cover the rest of the month.
const ASIAN_DEC = `<section class="hours-table"><h6><span class="hours-category regular"></span>Regular Hours (Sep 1-Dec 22)</h6><dl class="regular"><dt>Mon-Thu</dt><dd>9am - 7pm</dd><dt>Fri</dt><dd>9am - 5pm</dd><dt>Sat</dt><dd>11am - 4pm</dd><dt>Sun</dt><dd>Closed*</dd></dl><h6><span class="hours-category holiday"></span>Holiday Hours</h6><dl class="holiday"><dt>Dec 23-24</dt><dd>9am - 5pm</dd><dt>Dec 25-31</dt><dd>Closed*</dd></dl></section>`;
// IKBLC: open past midnight every day.
const IKBLC_OCT = `<section class="hours-table"><h6><span class="hours-category regular"></span>Regular Hours (Sep 1-Dec 22)</h6><dl class="regular"><dt>Mon-Sun</dt><dd>6am - 12am</dd></dl></section>`;

const d = (year: number, month: number, day: number) => ({ year, month, day });

Deno.test('parseHours reads the time formats the site uses', () => {
  assertEquals(parseHours('9am - 9pm'), { opensAt: '09:00', closesAt: '21:00' });
  assertEquals(parseHours('8:30am - 6pm'), { opensAt: '08:30', closesAt: '18:00' });
  assertEquals(parseHours('12pm - 5pm'), { opensAt: '12:00', closesAt: '17:00' });
  assertEquals(parseHours('6am - 12am'), { opensAt: '06:00', closesAt: '00:00' });
  assertEquals(parseHours('Closed*'), 'closed');
  assertEquals(parseHours('Closed* (Thanksgiving)'), 'closed');
});

Deno.test('parseHours rejects formats it does not know instead of guessing', () => {
  assertThrows(() => parseHours('Open 24 hours'));
  assertThrows(() => parseHours('9am - 12pm, 1pm - 5pm'));
  assertThrows(() => parseHours('12 - 6pm'));
});

Deno.test('parseWeekdays expands ranges, including ones that wrap the week', () => {
  assertEquals(parseWeekdays('Mon-Thu'), [1, 2, 3, 4]);
  assertEquals(parseWeekdays('Sat-Sun'), [6, 0]);
  assertEquals(parseWeekdays('Mon-Sun'), [1, 2, 3, 4, 5, 6, 0]);
  assertEquals(parseWeekdays('Fri'), [5]);
});

Deno.test('parseDateRange handles single dates, same-month and cross-month ranges', () => {
  assertEquals(parseDateRange('Oct 12'), { from: { month: 10, day: 12 }, to: { month: 10, day: 12 } });
  assertEquals(parseDateRange('Dec 23-24'), { from: { month: 12, day: 23 }, to: { month: 12, day: 24 } });
  assertEquals(parseDateRange('Dec 25-Jan 2'), { from: { month: 12, day: 25 }, to: { month: 1, day: 2 } });
});

Deno.test('a holiday row overrides the regular hours for its date', () => {
  const table = parseHoursTable(KOERNER_OCT);
  assertEquals(resolveDay(table, d(2026, 10, 12)), 'closed'); // Thanksgiving Monday
  assertEquals(resolveDay(table, d(2026, 10, 13)), { opensAt: '08:00', closesAt: '20:00' });
});

Deno.test('Thanksgiving week: Monday gets no row, every other day keeps its regular hours', () => {
  const tables = new Map([['2026-10', parseHoursTable(KOERNER_OCT)]]);
  const week = [11, 12, 13, 14, 15, 16, 17].map((day) => d(2026, 10, day)); // Sun..Sat
  assertEquals(buildWeekRows(tables, week), [
    { dayOfWeek: 0, opensAt: '11:00', closesAt: '18:00' },
    { dayOfWeek: 2, opensAt: '08:00', closesAt: '20:00' },
    { dayOfWeek: 3, opensAt: '08:00', closesAt: '20:00' },
    { dayOfWeek: 4, opensAt: '08:00', closesAt: '20:00' },
    { dayOfWeek: 5, opensAt: '08:00', closesAt: '18:00' },
    { dayOfWeek: 6, opensAt: '11:00', closesAt: '18:00' },
  ]);
});

Deno.test('the week the regular period ends switches over to the holiday ranges', () => {
  const tables = new Map([['2026-12', parseHoursTable(ASIAN_DEC)]]);
  const week = [20, 21, 22, 23, 24, 25, 26].map((day) => d(2026, 12, day)); // Sun..Sat
  assertEquals(buildWeekRows(tables, week), [
    // Sun Dec 20 closed (regular)
    { dayOfWeek: 1, opensAt: '09:00', closesAt: '19:00' }, // Mon Dec 21 regular
    { dayOfWeek: 2, opensAt: '09:00', closesAt: '19:00' }, // Tue Dec 22 regular
    { dayOfWeek: 3, opensAt: '09:00', closesAt: '17:00' }, // Wed Dec 23 holiday
    { dayOfWeek: 4, opensAt: '09:00', closesAt: '17:00' }, // Thu Dec 24 holiday
    // Fri Dec 25, Sat Dec 26 closed (holiday)
  ]);
});

Deno.test('a week spanning two months reads each date from its own month', () => {
  const tables = new Map([
    ['2026-10', parseHoursTable(KOERNER_OCT)],
    ['2026-11', parseHoursTable(KOERNER_OCT.replace('<dt>Oct 12</dt>', '<dt>Nov 11</dt>'))],
  ]);
  const week = [d(2026, 10, 30), d(2026, 10, 31), ...[1, 2, 3, 4, 5].map((day) => d(2026, 11, day))];
  assertEquals(buildWeekRows(tables, week).length, 7);
  assertThrows(() => buildWeekRows(new Map([['2026-10', parseHoursTable(KOERNER_OCT)]]), week));
});

Deno.test('a date outside every period with no holiday row fails the branch', () => {
  const table = parseHoursTable(KOERNER_OCT);
  assertThrows(() => resolveDay(table, d(2027, 1, 4)), Error, 'no hours rule covers');
});

Deno.test('a narrower block (e.g. exam hours) wins over the term it sits inside', () => {
  const html = `<section class="hours-table">
    <h6>Regular Hours (Sep 1-Dec 22)</h6><dl><dt>Mon-Sun</dt><dd>8am - 8pm</dd></dl>
    <h6>Exam Hours (Dec 7-Dec 18)</h6><dl><dt>Mon-Sun</dt><dd>8am - 11pm</dd></dl>
  </section>`;
  const table = parseHoursTable(html);
  assertEquals(resolveDay(table, d(2026, 12, 10)), { opensAt: '08:00', closesAt: '23:00' });
  assertEquals(resolveDay(table, d(2026, 12, 21)), { opensAt: '08:00', closesAt: '20:00' });
});

Deno.test('past-midnight closing is stored as-is for the read side to wrap', () => {
  const tables = new Map([['2026-10', parseHoursTable(IKBLC_OCT)]]);
  const rows = buildWeekRows(tables, [d(2026, 10, 4)]);
  assertEquals(rows, [{ dayOfWeek: 0, opensAt: '06:00', closesAt: '00:00' }]);
});

Deno.test('parseHoursTable throws when the section is missing or a row is unreadable', () => {
  assertThrows(() => parseHoursTable('<section class="calendar"></section>'), Error, 'no hours-table');
  assertThrows(() => parseHoursTable(KOERNER_OCT.replace('<dd>8am - 6pm</dd>', '<dd>Open 24 hours</dd>')));
});

Deno.test('parseBranchIds reads the numeric location_id from each calendar', () => {
  const html = `
    <section id="calendar_asian" class="calendar_wrapper"><section class="hours">
      <button class="prev-month" value="3">&lt; Prev</button></section></section>
    <section id="calendar_koerner" class="calendar_wrapper"><section class="hours">
      <button class="prev-month" value="2">&lt; Prev</button></section></section>`;
  assertEquals(
    parseBranchIds(html),
    new Map([
      ['asian', '3'],
      ['koerner', '2'],
    ]),
  );
});

Deno.test('calendarWeeks uses the Vancouver date, not the UTC one', () => {
  // 2026-10-04T05:00Z is still Saturday Oct 3 in Vancouver (UTC-7), so this week began Sep 27.
  const { thisWeek, nextWeek } = calendarWeeks(new Date('2026-10-04T05:00:00Z'));
  assertEquals(thisWeek.start, '2026-09-27');
  assertEquals(thisWeek.dates[6], d(2026, 10, 3));
  assertEquals(nextWeek.start, '2026-10-04');
  assertEquals(nextWeek.dates[6], d(2026, 10, 10));
});

Deno.test('calendarWeeks: the scheduled Sunday run starts this week on that Sunday in PDT and PST', () => {
  assertEquals(calendarWeeks(new Date('2026-10-04T08:30:00Z')).thisWeek.start, '2026-10-04');
  assertEquals(calendarWeeks(new Date('2026-12-06T08:30:00Z')).thisWeek.start, '2026-12-06');
});

Deno.test('calendarWeeks: a mid-week run still covers the whole Sunday-Saturday week', () => {
  const { thisWeek, nextWeek } = calendarWeeks(new Date('2026-10-08T19:00:00Z')); // Thu Oct 8
  assertEquals(thisWeek.start, '2026-10-04');
  assertEquals(
    thisWeek.dates.map((x) => x.day),
    [4, 5, 6, 7, 8, 9, 10],
  );
  assertEquals(nextWeek.start, '2026-10-11');
});

Deno.test('resolveWeeks saves this week even when next week runs past the published period', () => {
  // Week of Dec 13: this week is all regular hours; next week (Dec 20-26) needs the
  // holiday rows, which this October-style table (Oct 12 only) does not have.
  const tables = new Map([['2026-12', parseHoursTable(KOERNER_OCT)]]);
  const { thisWeek, nextWeek } = calendarWeeks(new Date('2026-12-13T08:30:00Z'));
  const result = resolveWeeks(tables, thisWeek, nextWeek);
  assertEquals(result.thisRows.length, 7);
  assertEquals(result.nextRows, null);
  assertEquals(result.nextError, 'no hours rule covers 12/23');
});

Deno.test('resolveWeeks returns both weeks when both resolve, holidays in the right week', () => {
  const tables = new Map([['2026-10', parseHoursTable(KOERNER_OCT)]]);
  const { thisWeek, nextWeek } = calendarWeeks(new Date('2026-10-04T08:30:00Z'));
  const result = resolveWeeks(tables, thisWeek, nextWeek);
  assertEquals(result.thisRows.length, 7); // Oct 4-10: open every day
  assertEquals(
    result.nextRows?.map((r) => r.dayOfWeek),
    [0, 2, 3, 4, 5, 6], // Oct 11-17: Thanksgiving Monday (1) closed
  );
});

Deno.test('resolveWeeks fails the branch when this week cannot resolve', () => {
  const tables = new Map([['2027-1', parseHoursTable(KOERNER_OCT)]]);
  const { thisWeek, nextWeek } = calendarWeeks(new Date('2027-01-03T08:30:00Z'));
  assertThrows(() => resolveWeeks(tables, thisWeek, nextWeek), Error, 'no hours rule covers');
});
