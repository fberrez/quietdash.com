import { Github, Mail } from 'lucide-react';

const BlueskyIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 640 640" aria-hidden="true">
    <path d="M439.8 358.7C436.5 358.3 433.1 357.9 429.8 357.4C433.2 357.8 436.5 358.3 439.8 358.7zM320 291.1C293.9 240.4 222.9 145.9 156.9 99.3C93.6 54.6 69.5 62.3 53.6 69.5C35.3 77.8 32 105.9 32 122.4C32 138.9 41.1 258 47 277.9C66.5 343.6 136.1 365.8 200.2 358.6C203.5 358.1 206.8 357.7 210.2 357.2C206.9 357.7 203.6 358.2 200.2 358.6C106.3 372.6 22.9 406.8 132.3 528.5C252.6 653.1 297.1 501.8 320 425.1C342.9 501.8 369.2 647.6 505.6 528.5C608 425.1 533.7 372.5 439.8 358.6C436.5 358.2 433.1 357.8 429.8 357.3C433.2 357.7 436.5 358.2 439.8 358.6C503.9 365.7 573.4 343.5 593 277.9C598.9 258 608 139 608 122.4C608 105.8 604.7 77.7 586.4 69.5C570.6 62.4 546.4 54.6 483.2 99.3C417.1 145.9 346.1 240.4 320 291.1z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="space-y-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">quietdash.com</div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Open-source e-ink dashboard system for Raspberry Pi. Transform your space
              with beautiful, distraction-free information displays.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/fberrez/quietdash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://bsky.app/profile/fberrez.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Bluesky"
              >
                <BlueskyIcon />
              </a>
              <a
                href="mailto:contact@quietdash.com"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} quietdash.com. All rights reserved. Built with ❤️ by the community.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with open-source technologies
          </p>
        </div>
      </div>
    </footer>
  );
}
