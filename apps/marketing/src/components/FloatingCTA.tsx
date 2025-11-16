import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Show CTA after scrolling past hero section (approximately 600px)
      const heroHeight = 600;
      const shouldShow = scrollY > heroHeight;

      // Check if we're near the waitlist section
      const waitlistSection = document.getElementById('waitlist');
      let nearWaitlist = false;
      if (waitlistSection) {
        const waitlistTop = waitlistSection.offsetTop;
        const viewportBottom = scrollY + windowHeight;

        // Hide if we're within 200px of the waitlist section
        nearWaitlist = viewportBottom >= waitlistTop - 200;
      }

      setIsVisible(shouldShow && !nearWaitlist);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      const offset = 80; // Account for sticky navigation
      const elementPosition = waitlistSection.offsetTop;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-6 md:left-auto md:right-6 md:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="container mx-auto px-4 md:px-0 pb-4 md:pb-0">
        <Button
          size="lg"
          className="w-full md:w-auto md:min-w-[200px] text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 group min-h-[56px] md:min-h-[48px]"
          asChild
        >
          <a href="#waitlist" onClick={handleClick}>
            <span className="hidden sm:inline">Join the Waitlist</span>
            <span className="sm:hidden">Join Waitlist</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </div>
    </div>
  );
}
