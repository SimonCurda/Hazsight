/**
 * Shared types for Hazsight.
 *
 * These mirror the Pydantic schemas in backend/src/hazsight/ai/schemas.py
 * so the frontend and backend speak the same language.
 */

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type HazardCategory =
  | 'PPE_VIOLATION'
  | 'FIRE_SMOKE'
  | 'SLIP_TRIP_FALL'
  | 'UNAUTHORIZED_ZONE'
  | 'MACHINERY_PROXIMITY'
  | 'UNSAFE_BEHAVIOR'
  | 'OTHER'

export const SEVERITY_COLORS: Record<
  RiskSeverity,
  {
    label: string
    badge: string
    box: string
    text: string
    bg: string
  }
> = {
  CRITICAL: {
    label: 'Critical',
    badge: 'bg-red-600 text-white hover:bg-red-700',
    box: 'border-red-500 bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500',
  },
  HIGH: {
    label: 'High',
    badge: 'bg-orange-500 text-white hover:bg-orange-600',
    box: 'border-orange-500 bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500',
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-amber-400 text-amber-950 hover:bg-amber-500',
    box: 'border-amber-400 bg-amber-400/20',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-400',
  },
  LOW: {
    label: 'Low',
    badge: 'bg-emerald-500 text-white hover:bg-emerald-600',
    box: 'border-emerald-500 bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500',
  },
}

export const HAZARD_CATEGORY_LABELS: Record<HazardCategory, string> = {
  PPE_VIOLATION: 'PPE Violation',
  FIRE_SMOKE: 'Fire / Smoke',
  SLIP_TRIP_FALL: 'Slip / Trip / Fall',
  UNAUTHORIZED_ZONE: 'Unauthorized Zone',
  MACHINERY_PROXIMITY: 'Machinery Proximity',
  UNSAFE_BEHAVIOR: 'Unsafe Behavior',
  OTHER: 'Other',
}
