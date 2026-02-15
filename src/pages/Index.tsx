import { useState } from "react";
import { motion } from "framer-motion";
import PatientIdentity from "@/components/nodes/PatientIdentity";
import NeuroVoiceAnalyzer from "@/components/nodes/NeuroVoiceAnalyzer";
import MedicalHistory from "@/components/nodes/MedicalHistory";
import WearableSync from "@/components/nodes/WearableSync";
import AITriageEngine from "@/components/nodes/AITriageEngine";

const Index = () => {
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    conditions: "",
    bloodPressure: "",
    bloodGroup: "O+",
  });
  const [transcript, setTranscript] = useState("");
  const [neuroRiskDetected, setNeuroRiskDetected] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground glow-text">
            LifeQueue
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-2 tracking-widest uppercase">
            AI-Powered Health Triage
          </p>
        </motion.div>
      </header>

      {/* Timeline */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        {/* Vertical glowing line */}
        <div className="hidden md:block absolute left-[2.15rem] top-0 bottom-0 w-0.5 timeline-line" />

        <div className="space-y-10">
          <PatientIdentity data={patient} onChange={setPatient} />
          <NeuroVoiceAnalyzer
            transcript={transcript}
            onTranscriptChange={setTranscript}
            neuroRiskDetected={neuroRiskDetected}
            onNeuroRiskChange={setNeuroRiskDetected}
          />
          <MedicalHistory />
          <WearableSync />
          <AITriageEngine 
            patient={patient} 
            transcript={transcript}
            neuroRiskDetected={neuroRiskDetected}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
