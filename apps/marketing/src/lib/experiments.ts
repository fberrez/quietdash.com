/**
 * A/B Testing Framework
 *
 * Simple feature flag system with hash-based bucket assignment
 * for deterministic user bucketing.
 */

import { trackExperimentView } from './plausible';

export type ExperimentVariant = 'control' | 'variant_a' | 'variant_b' | 'variant_c';

export interface Experiment {
  name: string;
  enabled: boolean;
  variants: ExperimentVariant[];
  // Traffic allocation percentage (0-100)
  traffic: number;
}

/**
 * Active experiments configuration
 */
const EXPERIMENTS: Record<string, Experiment> = {
  headline_test: {
    name: 'Headline Copy Test',
    enabled: true,
    variants: ['control', 'variant_a'],
    traffic: 100, // 100% of users see this test
  },
  cta_button_test: {
    name: 'CTA Button Copy Test',
    enabled: true,
    variants: ['control', 'variant_a', 'variant_b'],
    traffic: 100,
  },
  countdown_timer_test: {
    name: 'Countdown Timer Test',
    enabled: true,
    variants: ['control', 'variant_a'],
    traffic: 100,
  },
};

/**
 * Generate a deterministic hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a stable user identifier for bucketing
 * Uses localStorage to persist across sessions
 */
function getUserId(): string {
  const STORAGE_KEY = 'quietdash_user_id';

  if (typeof window === 'undefined') {
    return 'server';
  }

  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

/**
 * Assign a user to an experiment variant
 * Uses deterministic hashing to ensure consistent bucketing
 */
export function getExperimentVariant(experimentKey: string): ExperimentVariant {
  const experiment = EXPERIMENTS[experimentKey];

  if (!experiment || !experiment.enabled) {
    return 'control';
  }

  const userId = getUserId();
  const bucketKey = `${experimentKey}_${userId}`;
  const hash = hashString(bucketKey);

  // Check if user is in traffic allocation
  const trafficBucket = hash % 100;
  if (trafficBucket >= experiment.traffic) {
    return 'control';
  }

  // Assign to variant
  const variantIndex = hash % experiment.variants.length;
  const variant = experiment.variants[variantIndex];

  // Track experiment exposure
  trackExperimentView(experiment.name, variant);

  return variant;
}

/**
 * Check if a specific variant is active for an experiment
 */
export function isVariantActive(experimentKey: string, variant: ExperimentVariant): boolean {
  return getExperimentVariant(experimentKey) === variant;
}

/**
 * Headline copy variants
 */
export function getHeadlineCopy(): string {
  const variant = getExperimentVariant('headline_test');

  switch (variant) {
    case 'variant_a':
      return 'Lock in Early Bird Discount - Limited Early Access';
    case 'control':
    default:
      return 'First 100 backers get early access';
  }
}

/**
 * CTA button copy variants
 */
export function getCTAButtonCopy(): string {
  const variant = getExperimentVariant('cta_button_test');

  switch (variant) {
    case 'variant_a':
      return 'Claim My Early Bird Discount';
    case 'variant_b':
      return 'Get Early Bird Discount + Early Access';
    case 'control':
    default:
      return 'Reserve Your Spot';
  }
}

/**
 * Check if countdown timer should be shown
 */
export function shouldShowCountdown(): boolean {
  const variant = getExperimentVariant('countdown_timer_test');
  return variant === 'variant_a';
}

/**
 * Get all active experiments for the current user
 */
export function getActiveExperiments(): Array<{ name: string; variant: ExperimentVariant }> {
  return Object.entries(EXPERIMENTS)
    .filter(([, experiment]) => experiment.enabled)
    .map(([key, experiment]) => ({
      name: experiment.name,
      variant: getExperimentVariant(key),
    }));
}
