import { useRef, useEffect } from "react";
import { Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AcquisitionMode } from "./ControlPanel";

interface PlotAreaProps {
  mode: AcquisitionMode;
  samplingRate: number;
}

export const PlotArea = ({ mode, samplingRate }: PlotAreaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = (width: number, height: number) => {
      ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    const drawOSC = (width: number, height: number, phase: number) => {
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(34, 211, 238, 0.5)";
      ctx.shadowBlur = 8;

      ctx.beginPath();
      const amplitude = height * 0.35;
      const centerY = height / 2;
      const frequency = 2 + (samplingRate / 5000);

      for (let x = 0; x < width; x++) {
        const y = centerY + amplitude * Math.sin((x / width) * Math.PI * 2 * frequency + phase);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawFFT = (width: number, height: number, phase: number) => {
      const barCount = 64;
      const barWidth = (width / barCount) * 0.7;
      const gap = (width / barCount) * 0.3;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        const baseHeight = Math.sin(i * 0.3 + phase) * 0.5 + 0.5;
        const variation = Math.sin(i * 0.7 + phase * 2) * 0.3;
        const barHeight = (baseHeight + variation) * height * 0.7;

        const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
        gradient.addColorStop(0, "#22d3ee");
        gradient.addColorStop(1, "#8b5cf6");

        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(34, 211, 238, 0.4)";
        ctx.shadowBlur = 6;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      }
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(width, height);

      // Draw waveform based on mode
      if (mode === "osc") {
        drawOSC(width, height, phaseRef.current);
        phaseRef.current += 0.05;
      } else if (mode === "fft") {
        drawFFT(width, height, phaseRef.current);
        phaseRef.current += 0.03;
      } else {
        // Test sine wave in idle mode
        drawOSC(width, height, phaseRef.current);
        phaseRef.current += 0.02;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial setup with delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      resizeCanvas();
      animate();
    }, 100);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      clearTimeout(initTimeout);
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode, samplingRate]);

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Plot Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity
              className={cn(
                "w-4 h-4 transition-colors",
                mode === "osc" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                mode === "osc" ? "text-primary" : "text-muted-foreground"
              )}
            >
              OSC
            </span>
          </div>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <BarChart3
              className={cn(
                "w-4 h-4 transition-colors",
                mode === "fft" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                mode === "fft" ? "text-primary" : "text-muted-foreground"
              )}
            >
              FFT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span>
            Rate: <span className="text-foreground font-semibold">{samplingRate} Hz</span>
          </span>
          <span>
            Mode:{" "}
            <span className="text-foreground font-semibold uppercase">
              {mode === "idle" ? "---" : mode}
            </span>
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Idle State Overlay */}
        {mode === "idle" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-secondary/80 backdrop-blur-sm rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              Test mode • Select <span className="font-semibold text-primary">OSC</span> or{" "}
              <span className="font-semibold text-primary">FFT</span> to start acquisition
            </p>
          </div>
        )}
      </div>

      {/* Axis Labels */}
      <div className="px-4 py-1 border-t border-border bg-secondary/30 flex justify-between text-xs font-mono text-muted-foreground">
        <span>{mode === "fft" ? "0 Hz" : "0 ms"}</span>
        <span>{mode === "fft" ? "Time →" : "Frequency →"}</span>
        <span>{mode === "fft" ? `${samplingRate / 2} Hz` : `${1000 / samplingRate * 100} ms`}</span>
      </div>
    </div>
  );
};
