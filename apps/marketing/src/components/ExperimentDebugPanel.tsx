import { useState } from 'react';
import { getActiveExperiments } from '@/lib/experiments';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Beaker, X, RotateCcw } from 'lucide-react';

/**
 * Experiment Debug Panel
 * Shows which A/B test variants the current user is seeing
 * Only visible in development mode or when ?debug=true is in URL
 */
export function ExperimentDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [experiments, setExperiments] = useState(getActiveExperiments());

  // Only show in development or with ?debug=true
  const isDev = import.meta.env.DEV;
  const hasDebugParam = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug');

  if (!isDev && !hasDebugParam) {
    return null;
  }

  const handleReset = () => {
    if (confirm('Clear localStorage and reload? This will assign you to new experiment variants.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleRefresh = () => {
    setExperiments(getActiveExperiments());
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-colors"
        title="Open Experiment Debug Panel"
      >
        <Beaker className="h-5 w-5" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 p-4 shadow-xl border-purple-200 dark:border-purple-800">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">A/B Test Debug</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active Experiments */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Active Experiments:</p>
          {experiments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No active experiments</p>
          ) : (
            <div className="space-y-2">
              {experiments.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{exp.name}</p>
                      <Badge
                        variant={exp.variant === 'control' ? 'outline' : 'default'}
                        className="mt-1 text-xs"
                      >
                        {exp.variant}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="flex-1 text-xs text-orange-600 hover:text-orange-700"
          >
            Reset All
          </Button>
        </div>

        {/* Info */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Click "Reset All" to clear localStorage and get new variants
          </p>
        </div>
      </div>
    </Card>
  );
}
