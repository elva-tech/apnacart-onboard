import { DAYS_OF_WEEK, type DayOfWeek, type DayTiming } from '../types/onboarding'

function defaultDayTiming(): DayTiming {
  return { openTime: '09:00', closeTime: '21:00', closed: false }
}

/** Normalize sheet/API time strings for `<input type="time">` (HH:mm). */
export function normalizeTimeForInput(value: unknown): string {
  if (value == null || value === '') return ''

  const str = String(value).trim()
  if (!str || str.toUpperCase() === 'CLOSED') return ''

  const hm = str.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`

  const iso = str.match(/T(\d{2}):(\d{2})/)
  if (iso) return `${iso[1]}:${iso[2]}`

  const ampm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let hour = parseInt(ampm[1], 10)
    const minute = ampm[2]
    if (ampm[3].toUpperCase() === 'PM' && hour < 12) hour += 12
    if (ampm[3].toUpperCase() === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${minute}`
  }

  const loose = str.match(/(\d{1,2}):(\d{2})/)
  if (loose) return `${loose[1].padStart(2, '0')}:${loose[2]}`

  return ''
}

const FLAT_TIMING_KEYS: Record<DayOfWeek, { open: string; close: string }> = {
  monday: { open: 'mondayOpen', close: 'mondayClose' },
  tuesday: { open: 'tuesdayOpen', close: 'tuesdayClose' },
  wednesday: { open: 'wednesdayOpen', close: 'wednesdayClose' },
  thursday: { open: 'thursdayOpen', close: 'thursdayClose' },
  friday: { open: 'fridayOpen', close: 'fridayClose' },
  saturday: { open: 'saturdayOpen', close: 'saturdayClose' },
  sunday: { open: 'sundayOpen', close: 'sundayClose' },
}

export function normalizeTimingsFromApi(data: Record<string, unknown>): Record<DayOfWeek, DayTiming> {
  const result = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = defaultDayTiming()
      return acc
    },
    {} as Record<DayOfWeek, DayTiming>,
  )

  const nested = data.timings
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const day of DAYS_OF_WEEK) {
      const raw = (nested as Record<string, unknown>)[day]
      if (!raw || typeof raw !== 'object') continue
      const entry = raw as DayTiming
      const openTime = normalizeTimeForInput(entry.openTime)
      const closeTime = normalizeTimeForInput(entry.closeTime)
      result[day] = {
        openTime: openTime || result[day].openTime,
        closeTime: closeTime || result[day].closeTime,
        closed: Boolean(entry.closed),
      }
    }
    return result
  }

  for (const day of DAYS_OF_WEEK) {
    const keys = FLAT_TIMING_KEYS[day]
    const openRaw = data[keys.open]
    const closeRaw = data[keys.close]
    if (String(openRaw || '').toUpperCase() === 'CLOSED') {
      result[day].closed = true
      continue
    }
    const openTime = normalizeTimeForInput(openRaw)
    const closeTime = normalizeTimeForInput(closeRaw)
    if (openTime) result[day].openTime = openTime
    if (closeTime) result[day].closeTime = closeTime
  }

  return result
}
