// Market calendar — US equity market hours + holidays 2025-2027
// Fail-closed: if current year not in SUPPORTED_YEARS, return false.

const SUPPORTED_YEARS = [2025, 2026, 2027];

// Pre-computed US market holidays (NYSE/NASDAQ closures).
// Weekend-observed dates shifted to nearest weekday per federal rules.
const US_HOLIDAYS = new Map([
  // 2025
  ['2025-01-01', "New Year's Day"],
  ['2025-01-20', 'MLK Day'],
  ['2025-02-17', "Presidents' Day"],
  ['2025-04-18', 'Good Friday'],
  ['2025-05-26', 'Memorial Day'],
  ['2025-06-19', 'Juneteenth'],
  ['2025-07-04', 'Independence Day'],
  ['2025-09-01', 'Labor Day'],
  ['2025-11-27', 'Thanksgiving'],
  ['2025-12-25', 'Christmas'],
  // 2026
  ['2026-01-01', "New Year's Day"],
  ['2026-01-19', 'MLK Day'],
  ['2026-02-16', "Presidents' Day"],
  ['2026-04-03', 'Good Friday'],
  ['2026-05-25', 'Memorial Day'],
  ['2026-06-19', 'Juneteenth'],
  ['2026-07-03', 'Independence Day (observed)'],
  ['2026-09-07', 'Labor Day'],
  ['2026-11-26', 'Thanksgiving'],
  ['2026-12-25', 'Christmas'],
  // 2027
  ['2027-01-01', "New Year's Day"],
  ['2027-01-18', 'MLK Day'],
  ['2027-02-15', "Presidents' Day"],
  ['2027-03-26', 'Good Friday'],
  ['2027-05-31', 'Memorial Day'],
  ['2027-06-18', 'Juneteenth (observed)'],
  ['2027-07-05', 'Independence Day (observed)'],
  ['2027-09-06', 'Labor Day'],
  ['2027-11-25', 'Thanksgiving'],
  ['2027-12-24', 'Christmas (observed)'],
]);

export function getETNow() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map(p => [p.type, p.value])
  );
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .indexOf(parts.weekday?.slice(0, 3));
  const year = parseInt(parts.year, 10);
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
    dow,
    dateStr,
    year,
  };
}

export function isMarketOpen() {
  const { hour, minute, dow, dateStr, year } = getETNow();

  // Fail closed if holiday table doesn't cover current year
  if (!SUPPORTED_YEARS.includes(year)) {
    console.error('MAINTENANCE: holiday table does not cover current year');
    return false;
  }

  // Weekends
  if (dow === 0 || dow === 6) return false;

  // Holidays
  if (US_HOLIDAYS.has(dateStr)) return false;

  // Market hours: 9:30 ET (570 min) to 16:15 ET (975 min) inclusive
  const timeMinutes = hour * 60 + minute;
  return timeMinutes >= 570 && timeMinutes <= 975;
}
