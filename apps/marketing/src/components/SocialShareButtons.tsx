import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Check, Copy } from 'lucide-react';
import { trackReferralLinkShared, type SharePlatform } from '@/lib/plausible';

interface SocialShareButtonsProps {
  referralUrl: string;
  referralCode?: string;
}

// SVG icons for Twitter/X and Bluesky
const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const BlueskyIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 640 640" aria-hidden="true">
    <path d="M439.8 358.7C436.5 358.3 433.1 357.9 429.8 357.4C433.2 357.8 436.5 358.3 439.8 358.7zM320 291.1C293.9 240.4 222.9 145.9 156.9 99.3C93.6 54.6 69.5 62.3 53.6 69.5C35.3 77.8 32 105.9 32 122.4C32 138.9 41.1 258 47 277.9C66.5 343.6 136.1 365.8 200.2 358.6C203.5 358.1 206.8 357.7 210.2 357.2C206.9 357.7 203.6 358.2 200.2 358.6C106.3 372.6 22.9 406.8 132.3 528.5C252.6 653.1 297.1 501.8 320 425.1C342.9 501.8 369.2 647.6 505.6 528.5C608 425.1 533.7 372.5 439.8 358.6C436.5 358.2 433.1 357.8 429.8 357.3C433.2 357.7 436.5 358.2 439.8 358.6C503.9 365.7 573.4 343.5 593 277.9C598.9 258 608 139 608 122.4C608 105.8 604.7 77.7 586.4 69.5C570.6 62.4 546.4 54.6 483.2 99.3C417.1 145.9 346.1 240.4 320 291.1z" />
  </svg>
);

export function SocialShareButtons({ referralUrl }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `I'm on the QuietDash waitlist for their e-ink productivity dashboard! Join me and get early access perks: `;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      trackReferralLinkShared('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: SharePlatform, url: string) => {
    trackReferralLinkShared(platform);
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=450');
  };

  const hashtags = ' #QuietDash #productivity #dashboard #waitlist';
  const twitterText = `${shareText}${hashtags}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(referralUrl)}`;
  const blueskyText = `${shareText}${referralUrl}\n\nStop checking your phone 60 times a day. QuietDash shows your metrics on a distraction-free e-ink display.${hashtags}`;
  const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyText)}`;
  const emailSubject = 'Check out QuietDash - E-ink Productivity Dashboard';
  const emailBody = `${shareText}${referralUrl}\n\nStop checking your phone 60 times a day. QuietDash shows your metrics on a distraction-free e-ink display.`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Copy Link Button */}
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </>
          )}
        </Button>

        {/* Twitter/X Share */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter', twitterUrl)}
          className="gap-2"
        >
          <TwitterIcon />
          <span>Share on X</span>
        </Button>

        {/* Bluesky Share */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('bluesky', blueskyUrl)}
          className="gap-2"
        >
          <BlueskyIcon />
          <span>Share on Bluesky</span>
        </Button>

        {/* Email Share */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            trackReferralLinkShared('email');
            window.location.href = emailUrl;
          }}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          <span>Share via Email</span>
        </Button>
      </div>

      {/* Referral URL Display */}
      <div className="p-3 bg-muted rounded-lg text-sm font-mono text-center break-all">
        {referralUrl}
      </div>
    </div>
  );
}
