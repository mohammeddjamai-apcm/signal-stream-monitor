interface SamplingRateSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const SamplingRateSlider = ({
  value,
  onChange,
  min = 100,
  max = 10000,
  step = 100,
}: SamplingRateSliderProps) => {
  const formatHz = (hz: number) => {
    if (hz >= 1000) {
      return `${(hz / 1000).toFixed(1)} kHz`;
    }
    return `${hz} Hz`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Sampling Rate
        </label>
        <span className="font-mono text-sm font-bold text-primary">
          {formatHz(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>{formatHz(min)}</span>
        <span>{formatHz(max)}</span>
      </div>
    </div>
  );
};
