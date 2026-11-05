/** Vercel cron schedules (UTC). vercel.json must match; tests/schedule.test.ts checks this. */
export const DAILY_CRON = { path: "/api/cron/daily", schedule: "15 21 * * *", label: "매일 오전 6시 15분" };
export const WEEKLY_CRON = { path: "/api/cron/weekly", schedule: "45 21 * * 0", label: "매주 월요일 오전 6시 45분" };
/** Manual detection may run again only after this many minutes since the last detection. */
export const MANUAL_KIN_COOLDOWN_MINUTES = 5;
