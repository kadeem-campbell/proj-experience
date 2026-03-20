export type TimingIconName = 'sunrise' | 'sun' | 'sunset' | 'moon' | 'flexible' | 'mixed';
export type TimingProfileType = 'default' | 'seasonal' | 'date_override' | 'special_period' | 'override';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimingWindow {
  start_hour: number;
  end_hour: number;
  label: string;
}

export interface TimingProfileRecord {
  id: string;
  profile_label: string;
  profile_type: string | null;
  start_date: string | null;
  end_date: string | null;
  local_timezone: string | null;
  peak_start_hour: number | null;
  peak_end_hour: number | null;
  secondary_start_hour: number | null;
  secondary_end_hour: number | null;
  low_start_hour: number | null;
  low_end_hour: number | null;
  confidence_score: number | null;
  flexibility_level: string | null;
  reason_tags: unknown;
  timing_note: string | null;
  hourly_scores: unknown;
  template_id?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TimingTemplateRecord {
  id: string;
  name: string;
  slug: string;
  template_type: string | null;
  description: string | null;
  peak_start_hour: number | null;
  peak_end_hour: number | null;
  secondary_start_hour: number | null;
  secondary_end_hour: number | null;
  low_start_hour: number | null;
  low_end_hour: number | null;
  hourly_scores: unknown;
  is_active?: boolean | null;
}

export interface TimingDisplayOutput {
  primary_time_icon: TimingIconName;
  primary_time_label: string;
  short_timing_phrase: string;
}

export interface ResolvedTimingOutput {
  canonical_timezone: string;
  resolved_active_timing_profile: {
    id: string;
    profile_label: string;
    profile_type: string;
    template_id: string | null;
  } | null;
  hourly_suitability_scores: number[];
  preferred_windows: {
    primary: TimingWindow | null;
    secondary: TimingWindow | null;
  };
  reduced_suitability_windows: TimingWindow[];
  confidence: number | null;
  flexibility: string | null;
  reason_tags: string[];
  timing_note: string | null;
  derived_display: TimingDisplayOutput | null;
  source_profile: TimingProfileRecord | null;
}

const DEFAULT_TIMEZONE = 'UTC';
const PROFILE_PRIORITY: Record<string, number> = {
  special_period: 0,
  date_override: 1,
  override: 1,
  seasonal: 2,
  default: 3,
};

const clampHour = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(23, Math.round(value)));
};

export const isValidTimezone = (timezone?: string | null) => {
  if (!timezone) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export const normalizeReasonTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeHourlyScores = (value: unknown): number[] => {
  const base = Array.isArray(value) ? value : [];
  const normalized = Array.from({ length: 24 }, (_, index) => {
    const raw = Number(base[index] ?? 0.2);
    if (Number.isNaN(raw)) return 0.2;
    return Math.max(0, Math.min(1, Math.round(raw * 100) / 100));
  });

  return normalized;
};

export const buildHourlyCurve = (
  peakStart: number | null | undefined,
  peakEnd: number | null | undefined,
  secondaryStart?: number | null,
  secondaryEnd?: number | null,
  lowStart?: number | null,
  lowEnd?: number | null,
) => {
  const peakStartHour = clampHour(peakStart) ?? 8;
  const peakEndHour = clampHour(peakEnd) ?? 11;
  const secondaryStartHour = clampHour(secondaryStart);
  const secondaryEndHour = clampHour(secondaryEnd);
  const lowStartHour = clampHour(lowStart);
  const lowEndHour = clampHour(lowEnd);

  const scores = new Array(24).fill(0.18);

  const applyWindow = (start: number | null, end: number | null, score: number, mode: 'max' | 'min' = 'max') => {
    if (start == null || end == null) return;

    const length = start === end ? 24 : ((end - start + 24) % 24) || 24;
    for (let step = 0; step < length; step += 1) {
      const hour = (start + step) % 24;
      scores[hour] = mode === 'max' ? Math.max(scores[hour], score) : Math.min(scores[hour], score);
    }
  };

  applyWindow(secondaryStartHour, secondaryEndHour, 0.62, 'max');
  applyWindow(peakStartHour, peakEndHour, 1, 'max');
  applyWindow(lowStartHour, lowEndHour, 0.08, 'min');

  const smoothed = scores.map((score, index) => {
    const prev = scores[(index + 23) % 24];
    const next = scores[(index + 1) % 24];
    return Math.max(0, Math.min(1, Math.round((((score * 2) + prev + next) / 4) * 100) / 100));
  });

  return smoothed;
};

const formatWindowLabel = (startHour: number, endHour: number) => {
  const midpoint = ((startHour + (((endHour - startHour + 24) % 24) || 24) / 2) % 24);
  if (midpoint < 6) return 'Pre-dawn';
  if (midpoint < 10) return 'Morning';
  if (midpoint < 14) return 'Midday';
  if (midpoint < 18) return 'Afternoon';
  if (midpoint < 21) return 'Sunset';
  return 'Night';
};

const makeWindow = (startHour: number | null | undefined, endHour: number | null | undefined): TimingWindow | null => {
  const start = clampHour(startHour);
  const end = clampHour(endHour);
  if (start == null || end == null) return null;
  return {
    start_hour: start,
    end_hour: end,
    label: formatWindowLabel(start, end),
  };
};

const computePrimaryWindowFromCurve = (scores: number[]) => {
  let bestIndex = 0;
  let bestScore = -1;

  scores.forEach((score, index) => {
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  const threshold = Math.max(0.75, bestScore - 0.15);
  let start = bestIndex;
  let end = (bestIndex + 1) % 24;

  while (scores[(start + 23) % 24] >= threshold && ((bestIndex - start + 24) % 24) < 12) {
    start = (start + 23) % 24;
  }

  while (scores[end % 24] >= threshold && ((end - bestIndex + 24) % 24) < 12) {
    end = (end + 1) % 24;
  }

  return makeWindow(start, end % 24);
};

const inferIconFromWindow = (window: TimingWindow | null, flexibility: string | null): TimingIconName => {
  if (flexibility === 'high' || flexibility === 'flexible') return 'flexible';
  if (!window) return 'mixed';

  const midpoint = (window.start_hour + ((((window.end_hour - window.start_hour + 24) % 24) || 24) / 2)) % 24;

  if (midpoint < 7) return 'sunrise';
  if (midpoint < 15) return 'sun';
  if (midpoint < 20) return 'sunset';
  return 'moon';
};

const inferSlotFromIcon = (icon: TimingIconName): TimeSlot => {
  if (icon === 'sunrise') return 'morning';
  if (icon === 'sun') return 'afternoon';
  if (icon === 'sunset') return 'evening';
  if (icon === 'moon') return 'night';
  return 'afternoon';
};

export const deriveTimingDisplay = (profile: TimingProfileRecord | null) => {
  if (!profile) return null;

  const primaryWindow = makeWindow(profile.peak_start_hour, profile.peak_end_hour) ?? computePrimaryWindowFromCurve(normalizeHourlyScores(profile.hourly_scores));
  const icon = inferIconFromWindow(primaryWindow, profile.flexibility_level ?? null);

  const labelMap: Record<TimingIconName, string> = {
    sunrise: 'Best early morning',
    sun: 'Best during the day',
    sunset: 'Best around sunset',
    moon: 'Best at night',
    flexible: 'Flexible timing',
    mixed: 'Mixed timing',
  };

  const phrase = profile.timing_note?.trim() || (
    primaryWindow
      ? `${labelMap[icon]} · ${primaryWindow.start_hour}:00–${primaryWindow.end_hour}:00`
      : labelMap[icon]
  );

  return {
    primary_time_icon: icon,
    primary_time_label: labelMap[icon],
    short_timing_phrase: phrase,
  } satisfies TimingDisplayOutput;
};

export const inferTimeSlotFromProfile = (profile: TimingProfileRecord | null): TimeSlot | null => {
  const display = deriveTimingDisplay(profile);
  return display ? inferSlotFromIcon(display.primary_time_icon) : null;
};

const toMonthDay = (value: string) => value.slice(5, 10);

const isWithinRecurringRange = (travelMonthDay: string, startMonthDay: string, endMonthDay: string) => {
  if (startMonthDay <= endMonthDay) {
    return travelMonthDay >= startMonthDay && travelMonthDay <= endMonthDay;
  }

  return travelMonthDay >= startMonthDay || travelMonthDay <= endMonthDay;
};

const profileMatchesDate = (profile: TimingProfileRecord, travelDate?: string | Date | null) => {
  if (!travelDate) return profile.profile_type === 'default' || !profile.start_date || !profile.end_date;

  if (!profile.start_date || !profile.end_date) {
    return profile.profile_type === 'default';
  }

  const travel = new Date(travelDate);
  if (Number.isNaN(travel.getTime())) return false;

  const start = new Date(profile.start_date);
  const end = new Date(profile.end_date);

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (travel >= start && travel <= end) return true;
    return isWithinRecurringRange(toMonthDay(travel.toISOString()), toMonthDay(profile.start_date), toMonthDay(profile.end_date));
  }

  return false;
};

const sortProfiles = (profiles: TimingProfileRecord[]) => {
  return [...profiles].sort((a, b) => {
    const typeDelta = (PROFILE_PRIORITY[a.profile_type || 'default'] ?? 9) - (PROFILE_PRIORITY[b.profile_type || 'default'] ?? 9);
    if (typeDelta !== 0) return typeDelta;
    return (b.confidence_score ?? 0) - (a.confidence_score ?? 0);
  });
};

export const resolveTimingProfile = (
  profiles: TimingProfileRecord[],
  options?: { travelDate?: string | Date | null; timezone?: string | null },
): ResolvedTimingOutput => {
  const activeProfiles = profiles.filter((profile) => profile && profile.is_active !== false);
  const sorted = sortProfiles(activeProfiles);

  const matched = sorted.find((profile) => profileMatchesDate(profile, options?.travelDate))
    || sorted.find((profile) => profile.profile_type === 'default')
    || sorted[0]
    || null;

  const canonicalTimezone = matched?.local_timezone && isValidTimezone(matched.local_timezone)
    ? matched.local_timezone
    : (options?.timezone && isValidTimezone(options.timezone) ? options.timezone : DEFAULT_TIMEZONE);

  const hourlyScores = normalizeHourlyScores(matched?.hourly_scores);
  const primaryWindow = matched ? (makeWindow(matched.peak_start_hour, matched.peak_end_hour) ?? computePrimaryWindowFromCurve(hourlyScores)) : null;
  const secondaryWindow = matched ? makeWindow(matched.secondary_start_hour, matched.secondary_end_hour) : null;
  const reducedWindows = matched
    ? [makeWindow(matched.low_start_hour, matched.low_end_hour)].filter(Boolean) as TimingWindow[]
    : [];
  const display = matched ? deriveTimingDisplay({ ...matched, local_timezone: canonicalTimezone }) : null;

  return {
    canonical_timezone: canonicalTimezone,
    resolved_active_timing_profile: matched
      ? {
          id: matched.id,
          profile_label: matched.profile_label,
          profile_type: matched.profile_type || 'default',
          template_id: matched.template_id || null,
        }
      : null,
    hourly_suitability_scores: hourlyScores,
    preferred_windows: {
      primary: primaryWindow,
      secondary: secondaryWindow,
    },
    reduced_suitability_windows: reducedWindows,
    confidence: matched?.confidence_score ?? null,
    flexibility: matched?.flexibility_level ?? null,
    reason_tags: normalizeReasonTags(matched?.reason_tags),
    timing_note: matched?.timing_note ?? null,
    derived_display: display,
    source_profile: matched ? { ...matched, local_timezone: canonicalTimezone } : null,
  };
};

export const validateTimingProfiles = (
  profiles: TimingProfileRecord[],
  templates: Pick<TimingTemplateRecord, 'id'>[] = [],
) => {
  const issues: Array<{ field: string; severity: 'error' | 'warning'; message: string }> = [];
  const activeProfiles = profiles.filter((profile) => profile.is_active !== false);
  const defaults = activeProfiles.filter((profile) => profile.profile_type === 'default');

  if (defaults.length !== 1) {
    issues.push({
      field: 'default_profile',
      severity: 'error',
      message: 'Exactly one active default timing profile is required.',
    });
  }

  activeProfiles.forEach((profile) => {
    const timezone = profile.local_timezone;
    if (!isValidTimezone(timezone)) {
      issues.push({ field: `${profile.id}:timezone`, severity: 'error', message: `${profile.profile_label || 'Timing profile'} needs a valid timezone.` });
    }

    if (!Array.isArray(profile.hourly_scores) || normalizeHourlyScores(profile.hourly_scores).length !== 24) {
      issues.push({ field: `${profile.id}:hourly_scores`, severity: 'error', message: `${profile.profile_label || 'Timing profile'} needs 24 hourly suitability scores.` });
    }

    if ((profile.profile_type === 'seasonal' || profile.profile_type === 'date_override' || profile.profile_type === 'special_period' || profile.profile_type === 'override') && (!profile.start_date || !profile.end_date)) {
      issues.push({ field: `${profile.id}:date_range`, severity: 'error', message: `${profile.profile_label || 'Timing profile'} needs both a start and end date.` });
    }

    if (profile.start_date && profile.end_date && new Date(profile.start_date) > new Date(profile.end_date)) {
      issues.push({ field: `${profile.id}:date_order`, severity: 'error', message: `${profile.profile_label || 'Timing profile'} has an end date before its start date.` });
    }

    if (profile.template_id && !templates.some((template) => template.id === profile.template_id)) {
      issues.push({ field: `${profile.id}:template_id`, severity: 'error', message: `${profile.profile_label || 'Timing profile'} links to a missing timing template.` });
    }
  });

  const ranged = activeProfiles.filter((profile) => profile.start_date && profile.end_date);
  for (let i = 0; i < ranged.length; i += 1) {
    for (let j = i + 1; j < ranged.length; j += 1) {
      const left = ranged[i];
      const right = ranged[j];
      if ((left.profile_type || 'default') !== (right.profile_type || 'default')) continue;

      const leftStart = new Date(left.start_date!);
      const leftEnd = new Date(left.end_date!);
      const rightStart = new Date(right.start_date!);
      const rightEnd = new Date(right.end_date!);

      if (leftStart <= rightEnd && rightStart <= leftEnd) {
        issues.push({
          field: `${left.id}:${right.id}:overlap`,
          severity: 'warning',
          message: `${left.profile_label || 'Timing profile'} overlaps ${right.profile_label || 'another profile'} in the same timing type.`,
        });
      }
    }
  }

  return issues;
};