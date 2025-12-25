import { Play, Square, Activity, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SamplingRateSlider } from "./SamplingRateSlider";
import { cn } from "@/lib/utils";

export type AcquisitionMode = "idle" | "osc" | "fft";

interface ControlPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  samplingRate: number;
  onSamplingRateChange: (value: number) => void;
  acquisitionMode: AcquisitionMode;
  onStartOSC: () => void;
  onStartFFT: () => void;
  onStop: () => void;
}

export const ControlPanel = ({
  isCollapsed,
  onToggleCollapse,
  samplingRate,
  onSamplingRateChange,
  acquisitionMode,
  onStartOSC,
  onStartFFT,
  onStop,
}: ControlPanelProps) => {
  const isRunning = acquisitionMode !== "idle";

  return (
    <div
      className={cn(
        "relative flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-72"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-card border border-border rounded-r-md flex items-center justify-center hover:bg-secondary transition-colors"
        aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Panel Content */}
      <div
        className={cn(
          "flex-1 overflow-hidden transition-opacity duration-200",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Control Panel
            </h2>
          </div>

          {/* Sampling Rate */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <SamplingRateSlider
              value={samplingRate}
              onChange={onSamplingRateChange}
            />
          </div>

          {/* Start Buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Acquisition Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onStartOSC}
                disabled={isRunning}
                variant={acquisitionMode === "osc" ? "default" : "secondary"}
                className="h-12 font-medium"
              >
                <Activity className="w-4 h-4 mr-2" />
                OSC
              </Button>
              <Button
                onClick={onStartFFT}
                disabled={isRunning}
                variant={acquisitionMode === "fft" ? "default" : "secondary"}
                className="h-12 font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                FFT
              </Button>
            </div>
          </div>

          {/* Stop Button */}
          <Button
            onClick={onStop}
            disabled={!isRunning}
            variant="destructive"
            className="w-full h-14 font-semibold text-base"
          >
            <Square className="w-5 h-5 mr-2" fill="currentColor" />
            STOP
          </Button>

          {/* Status Info */}
          <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-mono font-medium text-foreground uppercase">
                {acquisitionMode === "idle" ? "---" : acquisitionMode}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={cn(
                  "font-medium",
                  isRunning ? "text-success" : "text-muted-foreground"
                )}
              >
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 space-y-4">
          <Activity
            className={cn(
              "w-5 h-5",
              acquisitionMode === "osc" ? "text-primary" : "text-muted-foreground"
            )}
          />
          <BarChart3
            className={cn(
              "w-5 h-5",
              acquisitionMode === "fft" ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
      )}
    </div>
  );
};
