"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <div className="relative">
        {theme === "dark" ? (
          <Moon className="w-5 h-5 text-[var(--icon-color)]" />
        ) : (
          <Sun className="w-5 h-5 text-[var(--icon-color)]" />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-[var(--text-primary)]">
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </span>
      )}
    </button>
  );
}
