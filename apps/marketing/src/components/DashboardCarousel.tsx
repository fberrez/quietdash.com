import { useState, useEffect } from 'react';
import { DashboardMockup } from './DashboardMockup';

type DashboardType = 'productivity' | 'health' | 'github' | 'portfolio' | 'morning';

const dashboardTypes: DashboardType[] = [
  'productivity',
  'health',
  'github',
  'portfolio',
  'morning',
];

const DURATION = 3000; // 3 seconds per dashboard

export function DashboardCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out completes, change dashboard and fade in
      timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % dashboardTypes.length);
        setIsVisible(true);
      }, 250); // Half of transition duration (500ms / 2)
    }, DURATION);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div
        className={`w-full flex-1 transition-opacity duration-500 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <DashboardMockup type={dashboardTypes[currentIndex]} className="w-full h-full" />
      </div>

      {/* Indicator dots - positioned outside the image */}
      <div className="flex justify-center gap-1.5 pb-1">
        {dashboardTypes.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6 bg-black' : 'w-1.5 bg-black/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
