// Capture full-page screenshots of /weekly-income with backtest table
// at required viewports: 360px, 390px, 1280px desktop
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'ui_captures');
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];

// Mock backtest API response with realistic data
const MOCK_BACKTEST = {
  periods: [
    {
      id: 'p1', period_start: '2025-06-30', period_end: '2025-07-11',
      trade_count: 8, wins: 7, losses: 1, flats: 0, win_rate: 87.5,
      net_pnl: 412.50, avg_credit: 1.85, avg_hold_days: 4.2,
      validation_state: 'valid', published_at: '2025-07-14T06:00:00Z',
      strategy_version: 'v1', run_status: 'PUBLISHED',
      trades: [
        { ticker: 'AAPL', side: 'PUT', strike: 210, expiration: '2025-07-11',
          entry_credit: 1.95, net_pnl: 93.70, outcome: 'WIN', days_held: 5,
          closed_at: '2025-07-07T16:00:00Z', exit_reason: 'Profit' },
        { ticker: 'MSFT', side: 'PUT', strike: 420, expiration: '2025-07-11',
          entry_credit: 2.10, net_pnl: 108.70, outcome: 'WIN', days_held: 4,
          closed_at: '2025-07-08T16:00:00Z', exit_reason: 'Profit' },
        { ticker: 'NVDA', side: 'CALL', strike: 140, expiration: '2025-07-11',
          entry_credit: 1.75, net_pnl: -148.30, outcome: 'LOSS', days_held: 3,
          closed_at: '2025-07-09T16:00:00Z', exit_reason: 'Stop' },
      ],
    },
    {
      id: 'p2', period_start: '2025-06-16', period_end: '2025-06-27',
      trade_count: 6, wins: 6, losses: 0, flats: 0, win_rate: 100.0,
      net_pnl: 523.40, avg_credit: 2.05, avg_hold_days: 3.8,
      validation_state: 'valid', published_at: '2025-06-30T06:00:00Z',
      strategy_version: 'v1', run_status: 'PUBLISHED',
    },
    {
      id: 'p3', period_start: '2025-06-02', period_end: '2025-06-13',
      trade_count: 0, wins: 0, losses: 0, flats: 0, win_rate: null,
      net_pnl: 0, avg_credit: null, avg_hold_days: null,
      validation_state: 'no_trades',
      warning_message: 'No modeled trades closed in this completed period.',
      published_at: '2025-06-16T06:00:00Z', strategy_version: 'v1',
      run_status: 'PUBLISHED',
    },
  ],
  total: 3,
  access: 'member',
  limit: 26,
  offset: 0,
  last_refresh: {
    attempted_at: '2025-07-14T06:00:00Z',
    status: 'PUBLISHED',
    failure_reason: null,
  },
  strategy_version: 'v1',
};

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Intercept backtest API
    await page.route('**/api/trades/backtest*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BACKTEST),
      });
    });

    // Intercept trades API for signal log
    await page.route('**/api/trades', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          open: [], closed_14d: [],
          mtd: { net_pnl: 0, wins: 0, losses: 0, flats: 0, count: 0, win_rate: 0 },
          data_health: { last_evaluated: null, issues: [] },
        }),
      });
    });

    await page.goto(`${BASE_URL}/weekly-income`, { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for the backtest table to render
    await page.waitForSelector('[data-testid="backtest-results-table"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Full page screenshot
    const filename = `backtest_${vp.name}.png`;
    const filepath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });

    // Measure the backtest table
    const measurements = await page.evaluate(() => {
      const table = document.querySelector('[data-testid="backtest-results-table"]');
      if (!table) return { found: false };
      const rect = table.getBoundingClientRect();
      const state = table.getAttribute('data-state');

      // Check font sizes
      const allElements = table.querySelectorAll('*');
      let minFont = 999;
      let fontViolations = 0;
      for (const el of allElements) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > 0 && fs < minFont) minFont = fs;
        if (fs > 0 && fs < 12 && el.textContent.trim().length > 0) fontViolations++;
      }

      // Check overflow
      const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

      return {
        found: true, state, width: rect.width, height: rect.height,
        top: rect.top, minFont, fontViolations, hasOverflow,
      };
    });

    results.push({ viewport: vp.name, filename, ...measurements });
    console.log(`✓ ${vp.name}: state=${measurements.state} minFont=${measurements.minFont}px fontViolations=${measurements.fontViolations} overflow=${measurements.hasOverflow}`);

    await context.close();
  }

  await browser.close();

  console.log('\n═══ Capture Summary ═══');
  console.log(JSON.stringify(results, null, 2));

  // Write measurement data
  writeFileSync(path.join(OUT_DIR, 'measurements.json'), JSON.stringify(results, null, 2));
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
