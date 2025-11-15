import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">quietdash.com</span>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Testimonials
              </a>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
              <a href="https://github.com/fberrez/quietdash.com" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href="#waitlist">Join Waitlist</a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
