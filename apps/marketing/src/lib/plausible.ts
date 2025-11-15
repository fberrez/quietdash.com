/**
 * Plausible Analytics Tracking Utilities
 *
 * Privacy-first analytics integration for waitlist conversion tracking.
 * Docs: https://plausible.io/docs/custom-props/for-custom-events
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

export type CTASource = 'hero' | 'nav' | 'pricing' | 'sticky' | 'footer';
export type SharePlatform = 'twitter' | 'bluesky' | 'email' | 'copy';

/**
 * Track when user views the waitlist form section
 */
export function trackWaitlistFormViewed() {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Waitlist Form Viewed');
  }
}

/**
 * Track when user clicks on a waitlist CTA button
 * @param source - Where the CTA was clicked from
 */
export function trackWaitlistCTAClicked(source: CTASource) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Waitlist CTA Clicked', {
      props: { source }
    });
  }
}

/**
 * Track when user submits the waitlist form
 * @param experimentVariant - Optional A/B test variant identifier
 */
export function trackWaitlistFormSubmitted(experimentVariant?: string) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Waitlist Form Submitted', {
      props: experimentVariant ? { variant: experimentVariant } : undefined
    });
  }
}

/**
 * Track when user successfully verifies their email
 * @param hadReferrer - Whether the user was referred by someone
 */
export function trackWaitlistVerificationCompleted(hadReferrer: boolean = false) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Waitlist Verification Completed', {
      props: { referred: hadReferrer ? 'yes' : 'no' }
    });
  }
}

/**
 * Track when someone clicks on a referral link
 * @param referralCode - The referral code used
 */
export function trackReferralLinkClicked(referralCode: string) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Referral Link Clicked', {
      props: { referralCode }
    });
  }
}

/**
 * Track when user shares their referral link
 * @param platform - Which platform they shared to
 */
export function trackReferralLinkShared(platform: SharePlatform) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Referral Link Shared', {
      props: { platform }
    });
  }
}

/**
 * Track A/B test variant exposure
 * @param experimentName - Name of the experiment
 * @param variant - Which variant the user saw
 */
export function trackExperimentView(experimentName: string, variant: string) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('Experiment Viewed', {
      props: {
        experiment: experimentName,
        variant
      }
    });
  }
}

/**
 * Track custom pageview with properties
 * Docs: https://plausible.io/docs/custom-props/for-pageviews
 * @param props - Custom properties to attach to the pageview
 */
export function trackPageview(props?: Record<string, string | number | boolean>) {
  if (typeof window.plausible !== 'undefined') {
    window.plausible('pageview', {
      props
    });
  }
}
