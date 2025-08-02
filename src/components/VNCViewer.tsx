import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APIClient } from '@/services/api';
import { VNCStatus } from '@/types';
import { Monitor, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function VNCViewer() {
  const [status, setStatus] = useState<VNCStatus | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const statusData = await APIClient.getVNCStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load VNC status:', error);
      setStatus({ running: false });
    }
  }, []);

  const refreshScreenshot = useCallback(() => {
    setScreenshotUrl(APIClient.getScreenshotURL());
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    loadStatus();
    refreshScreenshot();

    // Auto-refresh screenshot every 5 seconds
    const screenshotInterval = setInterval(refreshScreenshot, 5000);

    // Check status every 30 seconds
    const statusInterval = setInterval(loadStatus, 30000);

    return () => {
      clearInterval(screenshotInterval);
      clearInterval(statusInterval);
    };
  }, [loadStatus, refreshScreenshot]);

  const handleManualRefresh = () => {
    setLoading(true);
    refreshScreenshot();
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex-1 h-full bg-vnc-bg flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Desktop View</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge 
              variant={status?.running ? "default" : "destructive"}
              className="flex items-center space-x-1"
            >
              {status?.running ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span>{status?.running ? 'Connected' : 'Disconnected'}</span>
            </Badge>
            
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Refresh screenshot"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {status?.running && (
          <div className="mt-2 text-sm text-muted-foreground">
            {status.host}:{status.port} • Display {status.display} • 
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Screenshot Display */}
      <div className="flex-1 p-4">
        <Card className="h-full bg-vnc-bg border-border overflow-hidden">
          {status?.running ? (
            <div className="h-full flex items-center justify-center">
              <img
                src={screenshotUrl}
                alt="Desktop Screenshot"
                className="max-w-full max-h-full object-contain border border-border rounded"
                onError={(e) => {
                  console.error('Screenshot failed to load');
                  // You could set a fallback image or show an error state here
                }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">VNC Not Connected</h3>
                <p className="text-sm">The desktop viewer is currently offline</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}