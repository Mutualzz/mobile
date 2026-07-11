export const STATUS_DURATION_OPTIONS = [
  { labelKey: "duration.minutes", count: 15, durationMs: 15 * 60_000 },
  { labelKey: "duration.hours", count: 1, durationMs: 60 * 60_000 },
  { labelKey: "duration.hours", count: 4, durationMs: 4 * 60 * 60_000 },
  { labelKey: "duration.days", count: 1, durationMs: 24 * 60 * 60_000 },
  { labelKey: "duration.days", count: 3, durationMs: 3 * 24 * 60 * 60_000 },
  { labelKey: "duration.forever", count: null, durationMs: null },
] as const;

export type StatusDurationOption = (typeof STATUS_DURATION_OPTIONS)[number];
