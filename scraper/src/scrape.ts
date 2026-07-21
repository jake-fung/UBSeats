import { chromium, type Locator, type Page } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { BASE_URL } from './config';
import { mondayOf } from './transform';

export interface WeekPage {
  weekStart: Date; // local Monday 00:00 of the week the page covers
  html: string;
}

const AUTH_DIR = '.auth';
const STATE_PATH = `${AUTH_DIR}/state.json`;
const CWL_TIMEOUT_MS = 5 * 60_000;

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

async function selectOptionByLabel(page: Page, selector: string, pattern: RegExp): Promise<boolean> {
  const options = await safeEval(page, `${selector} option`, (os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
  );
  const hit = options.find((o) => pattern.test(o.label));
  if (!hit) return false;
  await page.selectOption(selector, hit.value);
  return true;
}

async function selectWeek(page: Page): Promise<void> {
  const options = await safeEval(page, '#lbWeeks option', (os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
  );

  const hit = options.find((o) => o.label.includes('This Week'));
  if (!hit) {
    throw new Error(
      `No week option matched 'This Week'. ` +
      `Available: ${options.map((o) => `${o.value}=${o.label}`).join(' | ')}`,
    );
  }
  await page.selectOption('#lbWeeks', hit.value);
}

export async function fetchGridPages(opts: { headed: boolean }): Promise<{ pages: WeekPage[]; formHtml: string }> {
  mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: !opts.headed });

  try {
    const context = await browser.newContext(existsSync(STATE_PATH) ? { storageState: STATE_PATH } : {});
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await ensurePastGate(page, opts.headed);
    await context.storageState({ path: STATE_PATH });

    await (await mustFind(page, '#LinkBtn_locationByZone')).click();
    await mustFind(page, '#dlObject');
    const formHtml = await page.content();

    await selectAllOptions(page, '#dlObject');
    await page.waitForLoadState('domcontentloaded').catch(() => { });
    if (!(await selectOptionByLabel(page, '#lbDays', /all ?days/i))) {
      console.warn('No "All Days" option found — leaving #lbDays at its default.');
    }
    if (!(await selectOptionByLabel(page, '#dlPeriod', /all ?day/i))) {
      console.warn('No "All Day" period option found — leaving #dlPeriod at its default.');
    }
    if (!(await selectOptionByLabel(page, '#dlType', /single \(basic\) timetable/i))) {
      console.warn('No "Single (Basic) Timetable" report type option found — leaving #dlType at its default.');
    }

    const pages: WeekPage[] = [];
    const thisMonday = mondayOf(new Date());

    await selectWeek(page);
    await (await mustFind(page, '#bGetTimetable')).click();
    await page.waitForLoadState('domcontentloaded');
    pages.push({ weekStart: thisMonday, html: await page.content() });

    return { pages, formHtml };
  } finally {
    await browser.close();
  }
}
