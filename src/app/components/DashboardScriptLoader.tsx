'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardScriptLoader() {
  const pathname = usePathname();

  useEffect(() => {
    // Remove existing script instance if present
    const existingScript = document.getElementById('spark-dashboard-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Append fresh script to execute layout event listeners
    const script = document.createElement('script');
    script.id = 'spark-dashboard-script';
    script.src = `/assets/js/dashboard.js?v=${Date.now()}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('spark-dashboard-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [pathname]);

  return null;
}