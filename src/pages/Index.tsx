import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { ControlPanel, AcquisitionMode } from "@/components/ControlPanel";
import { PlotArea } from "@/components/PlotArea";
import { ConnectionStatus } from "@/components/StatusLED";

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [samplingRate, setSamplingRate] = useState(1000);
  const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>("idle");

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Toggle theme
  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // Simulate WebSocket connection status
  useEffect(() => {
    // Simulate connecting state on mount
    setConnectionStatus("connecting");
    
    const connectTimeout = setTimeout(() => {
      setConnectionStatus("connected");
    }, 2000);

    return () => clearTimeout(connectTimeout);
  }, []);

  const handleStartOSC = () => {
    setAcquisitionMode("osc");
  };

  const handleStartFFT = () => {
    setAcquisitionMode("fft");
  };

  const handleStop = () => {
    setAcquisitionMode("idle");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar
        connectionStatus={connectionStatus}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Control Panel (Sidebar) */}
        <ControlPanel
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          samplingRate={samplingRate}
          onSamplingRateChange={setSamplingRate}
          acquisitionMode={acquisitionMode}
          onStartOSC={handleStartOSC}
          onStartFFT={handleStartFFT}
          onStop={handleStop}
        />

        {/* Plot Area */}
        <main className="flex-1 p-4">
          <PlotArea mode={acquisitionMode} samplingRate={samplingRate} />
        </main>
      </div>
    </div>
  );
};

export default Index;
