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

async function mustFind(page: Page, selector: string): Promise<Locator> {
  const locator = page.locator(selector);
  try {
    await locator.first().waitFor({ state: 'attached', timeout: 15_000 });
  } catch (err) {
    const ids = await page.$$eval('[id]', (els) => els.slice(0, 60).map((e) => e.id));
    throw new Error(
      `Selector ${selector} not found on ${page.url()}. Page ids: ${ids.join(', ')}. ` +
        `Scientia's page structure (or the academic-year URL) has likely changed.`,
      { cause: err },
    );
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
  const values = await page.$$eval(`${selector} option`, (os) => os.map((o) => (o as HTMLOptionElement).value));
  await page.selectOption(selector, values);
}

async function selectOptionByLabel(page: Page, selector: string, pattern: RegExp): Promise<boolean> {
  const options = await page.$$eval(`${selector} option`, (os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
  );
  const hit = options.find((o) => pattern.test(o.label));
  if (!hit) return false;
  await page.selectOption(selector, hit.value);
  return true;
}

async function selectWeek(page: Page, shortcutValue: 't' | 'n', weekStart: Date): Promise<void> {
  const options = await page.$$eval('#lbWeeks option', (os) =>
    os.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent ?? '' })),
  );
  if (options.some((o) => o.value === shortcutValue)) {
    await page.selectOption('#lbWeeks', shortcutValue);
    return;
  }
  // Fallback: match the option label containing this week's Monday as "20 Jul" style text.
  const dayMonth = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const hit = options.find((o) => o.label.includes(dayMonth));
  if (!hit) {
    throw new Error(
      `No week option matched shortcut '${shortcutValue}' or label containing '${dayMonth}'. ` +
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
    if (!(await selectOptionByLabel(page, '#lbDays', /all week/i))) await selectAllOptions(page, '#lbDays');
    if (!(await selectOptionByLabel(page, '#dlPeriod', /all ?day/i))) {
      console.warn('No "All Day" period option found — leaving #dlPeriod at its default.');
    }
    if (!(await selectOptionByLabel(page, '#dlType', /spreadsheet/i))) {
      console.warn('No "spreadsheet" report type option found — leaving #dlType at its default.');
    }

    const thisMonday = mondayOf(new Date());
    const nextMonday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + 7);
    const pages: WeekPage[] = [];

    for (const [shortcut, weekStart] of [
      ['t', thisMonday],
      ['n', nextMonday],
    ] as const) {
      await selectWeek(page, shortcut, weekStart);
      await (await mustFind(page, '#bGetTimetable')).click();
      await page.waitForLoadState('domcontentloaded');
      pages.push({ weekStart, html: await page.content() });
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await mustFind(page, '#dlObject');
    }

    return { pages, formHtml };
  } finally {
    await browser.close();
  }
}
