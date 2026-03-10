import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

export const DarkModeToggle: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full border-border/60 bg-background/80 backdrop-blur hover:bg-accent"
      onClick={() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '102b61',
          },
          body: JSON.stringify({
            sessionId: '102b61',
            runId: 'run1',
            hypothesisId: 'H4',
            location: 'components/DarkModeToggle.tsx:onClick',
            message: 'Dark mode toggle button clicked',
            data: { isDarkBefore: isDark },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion agent log

        toggle();
      }}
      aria-label={isDark ? "Comută la modul luminos" : "Comută la modul întunecat"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

