import { useState, useEffect } from "react";
import { Watch, Heart, Wind, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import TimelineNode from "@/components/TimelineNode";
import ECGWaveform from "@/components/ECGWaveform";
import { useVitalsBreathing } from "@/hooks/useVitalsBreathing";

const WearableSync = () => {
  const [pragyanId, setPragyanId] = useState("");
  const showDashboard = pragyanId.length === 5;

  // Initialize useVitalsBreathing hook with base values
  const { vitals, isSimulating, startSimulation } = useVitalsBreathing({
    heartRate: 75,
    systolicBP: 120,
    diastolicBP: 80,
    spO2: 98,
    respiratoryRate: 18,
  });

  // Start simulation when Pragyan ID is entered (5 characters)
  useEffect(() => {
    if (showDashboard && !isSimulating) {
      startSimulation();
    }
  }, [showDashboard, isSimulating, startSimulation]);

  // Format blood pressure for display
  const bloodPressure = `${vitals.systolicBP}/${vitals.diastolicBP}`;

  // Dynamic stats using live vitals
  const STATS = [
    { label: "SpO2", value: `${vitals.spO2}%`, icon: Heart, color: "text-primary" },
    { label: "Resp Rate", value: `${vitals.respiratoryRate} bpm`, icon: Wind, color: "text-secondary" },
    { label: "Blood Pressure", value: bloodPressure, icon: Brain, color: "text-primary" },
  ];

  return (
    <TimelineNode
      index={4}
      title="Wearable Sync Dashboard"
      icon={<Watch className="w-5 h-5 text-primary" />}
    >
      <div className="mb-4">
        <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
          Enter Patient ID
        </label>
        <Input
          placeholder="P-101"
          value={pragyanId}
          onChange={(e) => setPragyanId(e.target.value)}
          maxLength={5}
          className="w-48 bg-muted/50 border-border/50 focus:border-primary/50 font-mono"
        />
        {pragyanId.length > 0 && !showDashboard && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {5 - pragyanId.length} more character{5 - pragyanId.length !== 1 ? "s" : ""} needed
          </p>
        )}
      </div>

      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ECG Waveform - Dynamic based on heart rate */}
            <div className="mb-6">
              <ECGWaveform heartRate={vitals.heartRate} isLive={true} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card p-4 text-center"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TimelineNode>
  );
};

export default WearableSync;
