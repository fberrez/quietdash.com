import { Github, Mail, ExternalLink } from 'lucide-react';

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
                <ExternalLink className="h-5 w-5" />
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
