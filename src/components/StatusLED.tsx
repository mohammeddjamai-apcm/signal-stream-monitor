import { cn } from "@/lib/utils";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface StatusLEDProps {
  status: ConnectionStatus;
  className?: string;
}

const statusConfig = {
  connecting: {
    color: "text-warning",
    label: "Connecting...",
    className: "led-blink",
  },
  connected: {
    color: "text-success",
    label: "Connected",
    className: "led-connected",
  },
  disconnected: {
    color: "text-destructive",
    label: "Disconnected",
    className: "",
  },
};

export const StatusLED = ({ status, className }: StatusLEDProps) => {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          config.color,
          config.className,
          status === "connected" && "bg-success",
          status === "connecting" && "bg-warning",
          status === "disconnected" && "bg-destructive"
        )}
        style={{
          boxShadow: status === "disconnected" ? "none" : undefined,
        }}
      />
      <span className="text-sm font-medium text-muted-foreground">
        {config.label}
      </span>
    </div>
  );
};
