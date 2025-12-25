import { StatusLED, ConnectionStatus } from "./StatusLED";
import { ThemeToggle } from "./ThemeToggle";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { Radio } from "lucide-react";

interface TopBarProps {
  connectionStatus: ConnectionStatus;
  isDark: boolean;
  onThemeToggle: () => void;
}

export const TopBar = ({ connectionStatus, isDark, onThemeToggle }: TopBarProps) => {
  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between">
      {/* Left: Logo & Status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg text-foreground tracking-tight">
            Signal<span className="text-primary">Monitor</span>
          </span>
        </div>
        <div className="h-6 w-px bg-border" />
        <StatusLED status={connectionStatus} />
      </div>

      {/* Center: DateTime */}
      <DateTimeDisplay />

      {/* Right: Theme Toggle */}
      <div className="flex items-center gap-2">
        <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
      </div>
    </header>
  );
};
