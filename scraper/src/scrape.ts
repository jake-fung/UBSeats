import { chromium, type BrowserContext, type Locator, type Page } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { BASE_URL } from './config';
import { mondayOf } from './transform';

export interface WeekPage {
  weekStart: Date; // local Monday 00:00 of the week the page covers
  html: string;
}

const AUTH_DIR = '.auth';
const STATE_PATH = `${AUTH_DIR}/state.json`;
const CWL_TIMEOUT_MS = 5 * 60_000;
const POSTBACK_TIMEOUT_MS = 30_000;
const SUBMIT_TIMEOUT_MS = 60_000;

async function safeEval<R, Arg = void>(
  page: Page,
  selector: string,
  pageFunction: (elements: Element[], arg: Arg) => R,
  arg?: Arg,
): Promise<R> {
  const isContextDestroyed = (err: unknown) =>
    err instanceof Error && err.message.includes('Execution context was destroyed');

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await page.$$eval(selector, pageFunction as any, arg as any);
  } catch (err) {
    if (!isContextDestroyed(err)) throw err;
    await page.waitForLoadState('domcontentloaded').catch(() => { });
    await page.waitForLoadState('networkidle').catch(() => { });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await page.$$eval(selector, pageFunction as any, arg as any);
  }
}

async function mustFind(page: Page, selector: string): Promise<Locator> {
  const locator = page.locator(selector);
  try {
    await locator.first().waitFor({ state: 'attached', timeout: 15_000 });
  } catch (err) {
    let ids: string[] = [];
    try {
      ids = await safeEval(page, '[id]', (els) => els.slice(0, 60).map((e) => e.id));
    } catch {
      throw new Error(
        `Selector ${selector} not found, and the page navigated away while diagnosing (likely a postback race). Original error: ${err}`,
      );
    }
    throw new Error(`Selector ${selector} not found on ${page.url()}. Page ids: ${ids.join(', ')}.`, { cause: err });
  }
  return locator;
}

async function ensurePastGate(page: Page, headed: boolean): Promise<void> {
  const gated = page.url().includes('my.policy') || (await page.getByText('VPNLess').count()) > 0;
  if (!gated) return;
  if (!headed) {
    throw new Error(
      'Hit the UBC CWL/F5 gate. Run from campus Wi-Fi or UBC VPN, or re-run with --headed and complete CWL in the browser window.',
    );
  }
  console.log('CWL gate detected — complete the login (incl. Duo) in the browser window...');
  await page.waitForURL((url) => url.href.startsWith(BASE_URL), { timeout: CWL_TIMEOUT_MS });
}

async function selectAllOptions(page: Page, selector: string): Promise<void> {
  const values = await safeEval(page, `${selector} option`, (os) => os.map((o) => (o as HTMLOptionElement).value));
  await page.selectOption(selector, values);
}

/** Return the value of the first <option> whose label (default) or value matches the pattern. */
async function findOptionValue(
  page: Page,
  selector: string,
  pattern: RegExp,
  by: 'label' | 'value' = 'label',
): Promise<string | null> {
  const options = await safeEval(page, `${selector} option`, (os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
  );
  const hit = options.find((o) => pattern.test(by === 'value' ? o.value : o.label));
  return hit ? hit.value : null;
}

async function listOptions(page: Page, selector: string): Promise<string> {
  const options = await safeEval(page, `${selector} option`, (os) =>
    os.map((o) => `${(o as HTMLOptionElement).value}=${(o.textContent ?? '').trim()}`),
  );
  return options.join(' | ');
}

/**
 * Select an option on an ASP.NET AutoPostBack control (`onchange="__doPostBack(...)"`)
 * and wait for the postback round-trip to finish before returning, so the next
 * interaction doesn't race an in-flight form reload.
 */
async function selectAwaitingPostback(page: Page, selector: string, value: string): Promise<void> {
  const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: POSTBACK_TIMEOUT_MS }).catch(() => null);
  await page.selectOption(selector, value);
  await nav;
  await page.waitForLoadState('networkidle').catch(() => { });
}

/**
 * Drive the "General Teaching Spaces" form for one week and return the rendered
 * List Timetable HTML. Report type is set FIRST (it and the period dropdown are
 * AutoPostBack controls that reload the form), then the room/day/week selections
 * are made so a postback can't wipe them, then the form is submitted.
 */
async function fetchOneWeek(
  context: BrowserContext,
  headed: boolean,
  weekPattern: RegExp,
): Promise<{ html: string; formHtml: string }> {
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await ensurePastGate(page, headed);

    // Open the "General Teaching Spaces" view (this is itself a __doPostBack).
    const navToForm = page
      .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: POSTBACK_TIMEOUT_MS })
      .catch(() => null);
    await (await mustFind(page, '#LinkBtn_locationByZone')).click();
    await navToForm;
    await page.waitForLoadState('networkidle').catch(() => { });
    await mustFind(page, '#dlObject');
    const formHtml = await page.content();

    // 1) AutoPostBack controls first — each reloads the form, so set them before
    //    making the selections below (which a reload would otherwise clear).
    const periodValue = await findOptionValue(page, '#dlPeriod', /all ?day/i, 'label');
    if (periodValue) {
      await selectAwaitingPostback(page, '#dlPeriod', periodValue);
    } else {
      console.warn(`No "All Day" period option found — leaving #dlPeriod at its default. Options: ${await listOptions(page, '#dlPeriod')}`);
    }

    // "List Timetable" is the parseable text export; its LABEL is "List Timetable"
    // but its VALUE contains "textspreadsheet" — match on the value.
    const typeValue = await findOptionValue(page, '#dlType', /textspreadsheet/i, 'value');
    if (!typeValue) {
      throw new Error(
        `"List Timetable" report type (value containing "textspreadsheet") not found in #dlType. ` +
        `Options: ${await listOptions(page, '#dlType')}`,
      );
    }
    await selectAwaitingPostback(page, '#dlType', typeValue);

    // 2) Non-postback selections last (rooms, days, week).
    await selectAllOptions(page, '#dlObject');

    const daysValue = await findOptionValue(page, '#lbDays', /all ?days/i, 'label');
    if (daysValue) {
      await page.selectOption('#lbDays', daysValue);
    } else {
      console.warn(`No "All Days" option found — leaving #lbDays at its default. Options: ${await listOptions(page, '#lbDays')}`);
    }

    const weekValue = await findOptionValue(page, '#lbWeeks', weekPattern, 'label');
    if (!weekValue) {
      throw new Error(
        `No week option matched ${weekPattern} in #lbWeeks. Options: ${await listOptions(page, '#lbWeeks')}`,
      );
    }
    await page.selectOption('#lbWeeks', weekValue);

    const tag = weekPattern.source.replace(/[^a-z0-9]+/gi, '') || 'week';

    // Clicking "View Timetable" is a postback that stores the report request in
    // the session; the response injects `window.open('showtimetable.aspx')` to
    // display it. That popup is blocked under automation (it fires on load with
    // no user gesture), so instead we POST the form and then GET the report page
    // directly in the same page (same session cookies), which renders the grid.
    const nav = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: SUBMIT_TIMEOUT_MS }).catch(() => null);
    await (await mustFind(page, '#bGetTimetable')).click();
    await nav;
    await page.waitForLoadState('networkidle').catch(() => { });

    const reportUrl = new URL('showtimetable.aspx', BASE_URL).href;
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => { });
    const html = await page.content();
    const timeHits = (html.match(/[0-2]\d:[0-5]\d/g) || []).length;
    console.log(`[${tag}] report ${reportUrl}: ${html.length} bytes, ${timeHits} time-matches, hasSelectionForm=${html.includes('id="dlObject"')}`);

    if (html.includes('id="dlObject"')) {
      mkdirSync('fixtures', { recursive: true });
      const dbg = `fixtures/debug-report-${tag}.html`;
      writeFileSync(dbg, html);
      throw new Error(
        `${reportUrl} returned the selection form rather than a report (saved ${dbg}). ` +
        `The View Timetable postback may not have registered the report request.`,
      );
    }
    return { html, formHtml };
  } finally {
    await page.close().catch(() => { });
  }
}

export async function fetchGridPages(opts: { headed: boolean }): Promise<{ pages: WeekPage[]; formHtml: string }> {
  mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: !opts.headed });

  try {
    const context = await browser.newContext(existsSync(STATE_PATH) ? { storageState: STATE_PATH } : {});

    const thisMonday = mondayOf(new Date());
    const nextMonday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + 7);
    const weeks: { pattern: RegExp; weekStart: Date }[] = [
      { pattern: /this week/i, weekStart: thisMonday },
      { pattern: /next week/i, weekStart: nextMonday },
    ];

    const pages: WeekPage[] = [];
    let formHtml = '';
    for (const week of weeks) {
      const result = await fetchOneWeek(context, opts.headed, week.pattern);
      if (!formHtml) formHtml = result.formHtml;
      pages.push({ weekStart: week.weekStart, html: result.html });
      // Persist the session as soon as we're past the gate so a later failure
      // doesn't force another CWL login on the next run.
      await context.storageState({ path: STATE_PATH });
    }

    return { pages, formHtml };
  } finally {
    await browser.close();
  }
}
