import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fetchGridPages } from './scrape';

const args = new Set(process.argv.slice(2));
const headed = args.has('--headed');
const capture = args.has('--capture');

const { pages, formHtml } = await fetchGridPages({ headed });

if (capture) {
  mkdirSync('fixtures', { recursive: true });
  writeFileSync('fixtures/form.html', formHtml);
  const names = ['grid-week-t.html', 'grid-week-n.html'];
  pages.forEach((p, i) => {
    writeFileSync(`fixtures/${names[i]}`, p.html);
    console.log(`fixtures/${names[i]}: week of ${p.weekStart.toDateString()}, ${p.html.length} bytes`);
  });
}
