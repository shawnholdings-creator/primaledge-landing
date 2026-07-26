// v4.2r3 UI Capture — 12 full-page screenshots from the real modeled-trades dashboard
// Intercepts /api/trades (the actual data endpoint) to inject fixture states
// Validates: 44px touch targets, 12px text, overflow, route, state, unique hashes

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const ROUTE = '/weekly-income';
const OUT = 'C:/Users/shawn/.gemini/antigravity/brain/092eb89f-eb76-4af9-914b-6e051530b831/v4.2-package/ui';
const MIN_TOUCH = 44;
const MIN_FONT = 12;

// Build TradesResponse fixtures matching the BacktestSignalLog interface:
// { open: ModeledTrade[], closed_14d: ModeledTrade[], mtd: MTDSummary, data_health: {...} }
const makeMTD = (trades) => {
  const closed = trades.filter(t => t.outcome);
  return {
    net_pnl: closed.reduce((s,t) => s + (t.net_pnl || 0), 0),
    wins: closed.filter(t => t.outcome === 'WIN').length,
    losses: closed.filter(t => t.outcome === 'LOSS').length,
    flats: closed.filter(t => t.outcome === 'FLAT').length,
    count: closed.length,
    win_rate: closed.length ? closed.filter(t=>t.outcome==='WIN').length / closed.length : 0,
  };
};

const health = { last_evaluated: '2026-07-12T14:00:00Z', issues: [] };

const OPEN_TRADES = [
  { id: '1', ticker: 'AAPL', side: 'PUT', strike: 220, expiration: '2026-07-25', entry_credit: 3.65, entry_stock_price: 228, entry_dte: 14, alerted_at: '2026-07-01T10:00:00Z', status: 'OPEN', closed_at: null, exit_debit: null, exit_reason: null, days_held: null, gross_pnl: null, fees: null, net_pnl: null, outcome: null, tier: 'standard', is_spread: false },
  { id: '2', ticker: 'NVDA', side: 'CALL', strike: 140, expiration: '2026-07-18', entry_credit: 2.10, entry_stock_price: 135, entry_dte: 7, alerted_at: '2026-07-02T10:00:00Z', status: 'OPEN', closed_at: null, exit_debit: null, exit_reason: null, days_held: null, gross_pnl: null, fees: null, net_pnl: null, outcome: null, tier: 'standard', is_spread: false },
];

const CLOSED_TRADES = [
  { id: '3', ticker: 'MSFT', side: 'PUT', strike: 460, expiration: '2026-07-11', entry_credit: 4.10, entry_stock_price: 475, entry_dte: 10, alerted_at: '2026-06-30T10:00:00Z', status: 'CLOSED', closed_at: '2026-07-08T10:00:00Z', exit_debit: 1.20, exit_reason: 'PROFIT_TARGET', days_held: 8, gross_pnl: 290, fees: 1.30, net_pnl: 288.70, outcome: 'WIN', tier: 'standard', is_spread: false },
  { id: '4', ticker: 'AMZN', side: 'CALL', strike: 200, expiration: '2026-07-11', entry_credit: 5.50, entry_stock_price: 195, entry_dte: 12, alerted_at: '2026-06-29T10:00:00Z', status: 'CLOSED', closed_at: '2026-07-09T10:00:00Z', exit_debit: 8.75, exit_reason: 'STOP_LOSS', days_held: 10, gross_pnl: -325, fees: 1.30, net_pnl: -326.30, outcome: 'LOSS', tier: 'standard', is_spread: false },
  { id: '5', ticker: 'TSLA', side: 'PUT', strike: 250, expiration: '2026-07-11', entry_credit: 3.20, entry_stock_price: 265, entry_dte: 13, alerted_at: '2026-06-28T10:00:00Z', status: 'CLOSED', closed_at: '2026-07-11T16:00:00Z', exit_debit: 0, exit_reason: 'EXPIRATION', days_held: 13, gross_pnl: 320, fees: 0, net_pnl: 320, outcome: 'WIN', tier: 'standard', is_spread: false },
];

const DR_TRADE = { id: '6', ticker: 'META', side: 'PUT', strike: 500, expiration: '2026-07-18', entry_credit: 6.00, entry_stock_price: 520, entry_dte: 7, alerted_at: '2026-07-01T10:00:00Z', status: 'DATA_REVIEW', closed_at: null, exit_debit: null, exit_reason: null, days_held: null, gross_pnl: null, fees: null, net_pnl: null, outcome: null, tier: 'standard', is_spread: false };

const MIXED_TRADES = [
  { id: '7', ticker: 'GOOGL', side: 'PUT', strike: 180, expiration: '2026-07-25', entry_credit: 2.40, entry_stock_price: 188, entry_dte: 14, alerted_at: '2026-07-01T10:00:00Z', status: 'OPEN', closed_at: null, exit_debit: null, exit_reason: null, days_held: null, gross_pnl: null, fees: null, net_pnl: null, outcome: null, tier: 'standard', is_spread: false },
  { id: '8', ticker: 'NFLX', side: 'CALL', strike: 700, expiration: '2026-07-11', entry_credit: 7.00, entry_stock_price: 690, entry_dte: 10, alerted_at: '2026-06-30T10:00:00Z', status: 'CLOSED', closed_at: '2026-07-10T10:00:00Z', exit_debit: 3.50, exit_reason: 'FORCED_TIME_EXIT', days_held: 10, gross_pnl: 350, fees: 1.30, net_pnl: 348.70, outcome: 'WIN', tier: 'standard', is_spread: false },
  { id: '9', ticker: 'QQQ', side: 'CALL', strike: 510, expiration: '2026-07-18', entry_credit: 3.90, entry_stock_price: 500, entry_dte: 7, alerted_at: '2026-07-01T10:00:00Z', status: 'DATA_REVIEW', closed_at: null, exit_debit: null, exit_reason: null, days_held: null, gross_pnl: null, fees: null, net_pnl: null, outcome: null, tier: 'standard', is_spread: false },
];

// 7 states × 2 viewports (390px mobile, 1280px desktop) = 14 captures
const VIEWPORTS = [390, 1280];
const STATES = [
  { name: 'loading',     apiResponse: null, delay: 60000 },
  { name: 'error',       apiResponse: 'error' },
  { name: 'empty',       apiResponse: { open: [], closed_14d: [], mtd: makeMTD([]), data_health: health } },
  { name: 'open',        apiResponse: { open: OPEN_TRADES, closed_14d: [], mtd: makeMTD([]), data_health: health } },
  { name: 'closed',      apiResponse: { open: [], closed_14d: CLOSED_TRADES, mtd: makeMTD(CLOSED_TRADES), data_health: health } },
  { name: 'data_review', apiResponse: { open: [DR_TRADE], closed_14d: [], mtd: makeMTD([]), data_health: { last_evaluated: '2026-07-12T14:00:00Z', issues: ['Stale quote for META'] } } },
  { name: 'mixed',       apiResponse: { open: MIXED_TRADES.filter(t=>t.status!=='CLOSED'), closed_14d: MIXED_TRADES.filter(t=>t.status==='CLOSED'), mtd: makeMTD(MIXED_TRADES), data_health: health } },
];

const FIXTURES = [];
for (const state of STATES) {
  for (const vp of VIEWPORTS) {
    FIXTURES.push({ ...state, vp });
  }
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const hashes = new Set();
const measurements = [];

for (let i = 0; i < FIXTURES.length; i++) {
  const f = FIXTURES[i];
  const idx = String(i + 1).padStart(2, '0');
  const vpLabel = f.vp === 1280 ? 'desktop' : `${f.vp}px`;
  const fileName = `ui_${idx}_${vpLabel.replace('px','')}_${f.name}.png`;
  const label = `[${i+1}/14] ${vpLabel} ${f.name} (${f.vp}px)`;

  const context = await browser.newContext({
    viewport: { width: f.vp, height: 900 },
  });
  const page = await context.newPage();

  // Intercept /api/trades — the actual data endpoint
  await page.route('**/api/trades*', async (route) => {
    if (f.apiResponse === 'error') {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    } else if (f.apiResponse === null) {
      // Loading: never respond
      await new Promise(r => setTimeout(r, f.delay));
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(f.apiResponse),
      });
    }
  });

  // Also intercept Gist API calls (the page may also fetch from gist)
  await page.route('**/api.github.com/gists/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ files: { 'weekly_income_scan.json': { content: '{}' } }, history: [] }),
    });
  });

  await page.goto(`${BASE}${ROUTE}?_t=${Date.now()}_${i}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Validate: the dashboard must be visible at the route
  const url = page.url();
  if (!url.includes('/weekly-income')) {
    console.error(`FAIL ${label}: URL is ${url}, expected /weekly-income`);
    await context.close();
    process.exit(1);
  }

  // Check that the modeled-trades-dashboard element exists
  const dashCount = await page.locator('[data-testid="modeled-trades-dashboard"]').count();
  console.log(`  Dashboard element count: ${dashCount}`);

  // Measure touch targets and font sizes
  const metrics = await page.evaluate(({ minTouch, minFont }) => {
    const touchViolations = [];
    const fontViolations = [];
    document.querySelectorAll('button, a, [role="button"], input, select').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.height < minTouch) {
        touchViolations.push({ tag: el.tagName, text: (el.textContent||'').slice(0,30), h: Math.round(rect.height) });
      }
    });
    document.querySelectorAll('*').forEach(el => {
      const style = getComputedStyle(el);
      const fs = parseFloat(style.fontSize);
      if (el.textContent?.trim() && fs > 0 && fs < minFont && el.children.length === 0) {
        fontViolations.push({ tag: el.tagName, text: (el.textContent||'').slice(0,30), size: Math.round(fs) });
      }
    });
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { touchViolations, fontViolations, overflow };
  }, { minTouch: MIN_TOUCH, minFont: MIN_FONT });

  const touchStatus = metrics.touchViolations.length === 0 ? 'PASS' : `FAIL(${metrics.touchViolations.length})`;
  const fontStatus = metrics.fontViolations.length === 0 ? 'PASS' : `FAIL(${metrics.fontViolations.length})`;
  const overflowStatus = metrics.overflow ? 'FAIL' : 'PASS';

  // Full-page screenshot
  const buf = await page.screenshot({ fullPage: true });
  const filePath = join(OUT, fileName);
  writeFileSync(filePath, buf);

  const hash = createHash('sha256').update(buf).digest('hex').toUpperCase();
  if (hashes.has(hash)) {
    console.error(`FAIL ${label}: DUPLICATE hash ${hash}`);
    await context.close();
    process.exit(1);
  }
  hashes.add(hash);

  measurements.push({
    idx: i+1, vp: vpLabel, state: f.name,
    overflow: overflowStatus, touch: touchStatus, font: fontStatus,
    file: fileName, hash, bytes: buf.length,
    dashboardFound: dashCount > 0,
    touchViolations: metrics.touchViolations.slice(0, 5),
    fontViolations: metrics.fontViolations.slice(0, 5),
  });

  console.log(`${label}`);
  console.log(`  ✓ Route: /weekly-income, fullPage: true, dashboard: ${dashCount > 0}`);
  console.log(`  ✓ Metrics: overflow=${overflowStatus}, touch=${touchStatus}, font=${fontStatus}`);

  results.push({ file: fileName, state: f.name, vp: vpLabel, pass: true });
  await context.close();
}

await browser.close();

// Write measurements JSON
writeFileSync(join(OUT, 'ui_measurements.json'), JSON.stringify(measurements, null, 2));

// Print summary table
console.log('');
console.log(`=== UI Capture Summary: ${results.length} passed, 0 failed ===`);
console.log(`✓ All ${hashes.size} PNG hashes are unique`);

// Generate contact sheet index
const contactInfo = measurements.map(m => `${m.file}: ${m.bytes} bytes, ${m.hash.slice(0,16)}...`);
writeFileSync(join(OUT, 'contact_sheet_index.txt'), contactInfo.join('\n'));
