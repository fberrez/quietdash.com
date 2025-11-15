import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Check, Copy } from 'lucide-react';
import { trackReferralLinkShared, type SharePlatform } from '@/lib/plausible';

interface SocialShareButtonsProps {
  referralUrl: string;
  referralCode?: string;
}

// SVG icons for Twitter and LinkedIn
const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function SocialShareButtons({ referralUrl }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `I'm on the QuietDash waitlist for their e-ink productivity dashboard! Join me and get early access perks:`;

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

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
  const emailSubject = 'Check out QuietDash - E-ink Productivity Dashboard';
  const emailBody = `${shareText}\n\n${referralUrl}\n\nStop checking your phone 60 times a day. QuietDash shows your metrics on a distraction-free e-ink display.`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Copy Link Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
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

        {/* LinkedIn Share */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('linkedin', linkedInUrl)}
          className="gap-2"
        >
          <LinkedInIcon />
          <span>Share on LinkedIn</span>
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
