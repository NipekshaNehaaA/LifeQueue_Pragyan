import { useMemo, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface ECGWaveformProps {
  heartRate: number;
  isLive?: boolean;
}

interface ECGDataPoint {
  time: number;
  voltage: number;
}

// Normal rhythm pattern (HR <= 100 bpm) - smooth sine wave with P-QRS-T complex
const NORMAL_PATTERN = [
  0, 2, 5, 3, 0,           // P wave
  0, 0, -2, 15, -5, 0,     // QRS complex
  0, 3, 6, 4, 0, 0         // T wave
];

// Tachycardia pattern (HR > 100 bpm) - chaotic, spiked pattern
const TACHYCARDIA_PATTERN = [
  0, 8, -3, 18, -8, 2,
  0, -4, 12, -6, 0,
  5, -2, 20, -10, 0,
  0, 6, -4, 0
];

const generateECGData = (heartRate: number, dataPoints: number): ECGDataPoint[] => {
  // Select pattern based on heart rate
  const pattern = heartRate > 100 ? TACHYCARDIA_PATTERN : NORMAL_PATTERN;
  
  return Array.from({ length: dataPoints }, (_, i) => ({
    time: i * 0.1, // 100ms intervals
    voltage: pattern[i % pattern.length] + (Math.random() - 0.5) * 0.5 // Add slight noise
  }));
};

const ECGWaveform = ({ heartRate, isLive = true }: ECGWaveformProps) => {
  const [dataPoints] = useState(100); // 10-second window at 100ms intervals
  const [ecgData, setEcgData] = useState<ECGDataPoint[]>(() => 
    generateECGData(heartRate, dataPoints)
  );

  // Update waveform when heart rate changes or for live simulation
  useEffect(() => {
    if (!isLive) {
      setEcgData(generateECGData(heartRate, dataPoints));
      return;
    }

    const interval = setInterval(() => {
      setEcgData(generateECGData(heartRate, dataPoints));
    }, 500); // Update every 500ms for smooth animation

    return () => clearInterval(interval);
  }, [heartRate, isLive, dataPoints]);

  const patternType = useMemo(() => {
    return heartRate > 100 ? 'Tachycardia' : 'Normal Rhythm';
  }, [heartRate]);

  return (
    <div className="p-4 rounded-lg bg-[#0A0F1A] border border-border/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Live ECG Monitor
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            {patternType}
          </span>
          <span className="text-sm font-mono text-[#10B981] font-bold">
            {heartRate} bpm
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={ecgData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            domain={[-15, 25]} 
            hide 
          />
          <Line
            type="monotone"
            dataKey="voltage"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ECGWaveform;
