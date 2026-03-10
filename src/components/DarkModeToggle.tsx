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
      onClick={toggle}
      aria-label={isDark ? "Comută la modul luminos" : "Comută la modul întunecat"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};
