import { useEffect, useState } from 'react';

export function useRelativeTime(timestamp: string): string {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    function calculate() {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      
      if (diffSec < 60) {
        setRelativeTime('just now');
      } else {
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) {
          setRelativeTime(`${diffMin}m ago`);
        } else {
          const diffHr = Math.floor(diffMin / 60);
          if (diffHr < 24) {
            setRelativeTime(`${diffHr}h ago`);
          } else {
            const diffDays = Math.floor(diffHr / 24);
            setRelativeTime(`${diffDays}d ago`);
          }
        }
      }
    }

    calculate();
    const interval = setInterval(calculate, 30000); // update every 30 seconds

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
