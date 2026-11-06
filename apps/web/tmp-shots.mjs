import { chromium } from '@playwright/test';
const base = 'https://mortisqaq.github.io/personal-blog/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const bad = [];
page.on('requestfailed', (r) => bad.push('REQFAIL ' + r.url()));
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
const shots = [];
for (const [name, route] of [['home', '#/Home'], ['information', '#/Information'], ['portfolio', '#/Portfolio']]) {
  await page.goto(base + route, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  const file = 'D:/projects/playground/blog/output/shots/' + name + '.png';
  await page.screenshot({ path: file });
  shots.push(file);
}
console.log(JSON.stringify({ shots, failures: [...new Set(bad)].slice(0, 20) }, null, 1));
await browser.close();
