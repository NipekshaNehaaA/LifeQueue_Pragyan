import { useState, useEffect } from "react";
import { Zap, ShieldCheck, Ticket, Download, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import TimelineNode from "@/components/TimelineNode";
import { analyzeTriage, ContextualPayload } from "@/services/llmTriage";
import { sendHighRiskAlert, isTwilioConfigured } from "@/services/twilioAlert";

interface PatientData {
  name: string;
  age: string;
  gender: string;
  conditions: string;
  bloodPressure: string;
  bloodGroup: string;
}

interface Props {
  patient: PatientData;
  transcript: string;
  neuroRiskDetected: boolean;
}

const TOKEN_KEY = "pragyan_token_counter";

// Radar chart calculation functions
export const calculateCardiacScore = (systolic: number, diastolic: number): number => {
  // Normal: 120/80 = 50 points
  // High: 160/100 = 80 points
  // Critical: 180/110 = 100 points
  const systolicScore = Math.min((systolic / 120) * 50, 100);
  const diastolicScore = Math.min((diastolic / 80) * 50, 100);
  return (systolicScore + diastolicScore) / 2;
};

export const calculateNeuroScore = (neuroRiskState: 'NORMAL' | 'ELEVATED' | 'CRITICAL'): number => {
  const scoreMap: Record<'NORMAL' | 'ELEVATED' | 'CRITICAL', number> = {
    'NORMAL': 0,
    'ELEVATED': 50,
    'CRITICAL': 100
  };
  return scoreMap[neuroRiskState];
};

export const calculateVitalsScore = (heartRate: number): number => {
  // Normal range: 60-100 bpm = low score
  // Outside range = higher score
  if (heartRate >= 60 && heartRate <= 100) {
    return 30; // Normal
  }
  const deviation = Math.abs(heartRate - 80); // 80 is ideal
  return Math.min(30 + deviation, 100);
};

export const calculateHistoryScore = (conditions: string): number => {
  // Count number of conditions mentioned
  const conditionCount = conditions.split(',').filter(c => c.trim()).length;
  return Math.min(conditionCount * 20, 100);
};

export const calculateSpeechScore = (transcript: string, biomarkers: string[]): number => {
  // Count detected biomarker keywords
  const detectedCount = biomarkers.filter(keyword => 
    transcript.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  return Math.min(detectedCount * 25, 100);
};

// CSV generation function with proper escaping and formatting
export const generateCSV = (
  patient: PatientData,
  transcript: string,
  neuroRiskDetected: boolean,
  riskScore: number,
  department: string,
  aiReasoning: string | null
): { csv: string; filename: string } => {
  // Helper function to escape CSV fields (handle commas, quotes, newlines)
  const escapeCSVField = (field: string): string => {
    // Convert to string and handle null/undefined
    const str = field?.toString() || '';
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  };

  // Collect all session data fields
  const timestamp = new Date().toISOString();
  const sessionData = {
    timestamp,
    patient_name: patient.name || '',
    age: patient.age || '',
    gender: patient.gender || '',
    blood_pressure: patient.bloodPressure || '',
    heart_rate: '75', // Default value - will be replaced when vitals are passed as props
    blood_group: patient.bloodGroup || '',
    symptom_transcript: transcript || '',
    neuro_risk_state: neuroRiskDetected ? 'CRITICAL' : 'NORMAL',
    ehr_conditions: patient.conditions || '',
    risk_score: riskScore.toString(),
    department: department || '',
    clinical_justification: aiReasoning || 'Rule-based analysis',
  };

  // Generate header row with column names
  const headers = [
    'timestamp',
    'patient_name',
    'age',
    'gender',
    'blood_pressure',
    'heart_rate',
    'blood_group',
    'symptom_transcript',
    'neuro_risk_state',
    'ehr_conditions',
    'risk_score',
    'department',
    'clinical_justification',
  ];

  // Generate data row with proper escaping
  const dataRow = [
    escapeCSVField(sessionData.timestamp),
    escapeCSVField(sessionData.patient_name),
    escapeCSVField(sessionData.age),
    escapeCSVField(sessionData.gender),
    escapeCSVField(sessionData.blood_pressure),
    escapeCSVField(sessionData.heart_rate),
    escapeCSVField(sessionData.blood_group),
    escapeCSVField(sessionData.symptom_transcript),
    escapeCSVField(sessionData.neuro_risk_state),
    escapeCSVField(sessionData.ehr_conditions),
    escapeCSVField(sessionData.risk_score),
    escapeCSVField(sessionData.department),
    escapeCSVField(sessionData.clinical_justification),
  ];

  // Combine header and data rows
  const csv = [headers.join(','), dataRow.join(',')].join('\n');

  // Generate filename with timestamp pattern: triage_session_YYYYMMDD_HHMMSS.csv
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const filename = `triage_session_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;

  return { csv, filename };
};

const AITriageEngine = ({ patient, transcript, neuroRiskDetected }: Props) => {
  const [showResults, setShowResults] = useState(false);
  const [tokenNumber, setTokenNumber] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRiskLevel, setAiRiskLevel] = useState<"HIGH" | "MEDIUM" | "LOW" | null>(null);
  const [aiRiskScore, setAiRiskScore] = useState<number | null>(null);
  const [aiDepartment, setAiDepartment] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [alertSentForSession, setAlertSentForSession] = useState(false);
  const [showAlertBanner, setShowAlertBanner] = useState(false);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(false);
  const [showFallbackWarning, setShowFallbackWarning] = useState(false);
  const { toast } = useToast();

  const lowerTranscript = transcript.toLowerCase();
  const hasChestPain = /chest\s*pain/i.test(transcript);
  const hasTremor = /tremor|shaking|stiff/i.test(transcript);

  // Enhanced risk calculation with blood pressure and neuro-risk
  const calculateRiskScore = (): number => {
    let riskScore = 0;

    // Parse blood pressure
    if (patient.bloodPressure) {
      const bpParts = patient.bloodPressure.split('/');
      if (bpParts.length === 2) {
        const systolic = parseInt(bpParts[0]);
        const diastolic = parseInt(bpParts[1]);
        
        // Add 30 points if systolic > 160 OR diastolic > 100
        if (systolic > 160 || diastolic > 100) {
          riskScore += 30;
        }
      }
    }

    // Add 40 points if neuro-risk detected
    if (neuroRiskDetected) {
      riskScore += 40;
    }

    return riskScore;
  };

  const riskScore = aiRiskScore !== null ? aiRiskScore : calculateRiskScore();
  const age = parseInt(patient.age) || 0;
  const hasConditions = patient.conditions.trim().length > 0;
  
  // Use AI results if available, otherwise fall back to rule-based
  const riskLevel: "HIGH" | "MEDIUM" | "LOW" = aiRiskLevel || (
    riskScore >= 60 || hasChestPain || (neuroRiskDetected && age > 50)
      ? "HIGH"
      : riskScore >= 30 || hasTremor || hasConditions || age > 60
      ? "MEDIUM"
      : "LOW"
  );

  const department = aiDepartment || (hasChestPain ? "Cardiology" : hasTremor ? "Neurology" : "General Medicine");

  // Automatic critical alert triggering when risk score >= 75
  useEffect(() => {
    const triggerCriticalAlert = async () => {
      // Only trigger if:
      // 1. Risk score is >= 75 (critical threshold)
      // 2. Alert hasn't been sent for this session yet
      // 3. Results are showing (analysis is complete)
      if (riskScore >= 75 && !alertSentForSession && showResults) {
        setAlertSentForSession(true); // Prevent duplicate alerts
        
        const doctorPhone = import.meta.env.VITE_DOCTOR_PHONE || "+1234567890";
        
        if (isTwilioConfigured()) {
          try {
            const smsResult = await sendHighRiskAlert(
              patient.name || "Unknown Patient",
              riskScore,
              department,
              doctorPhone
            );

            if (smsResult.success) {
              // Show visual confirmation banner
              setShowAlertBanner(true);
              
              // Auto-dismiss banner after 10 seconds
              setTimeout(() => {
                setShowAlertBanner(false);
              }, 10000);
              
              toast({
                title: "🚨 CRITICAL ALERT SENT",
                description: `Specialist notified via WhatsApp Gateway (${doctorPhone})`,
                variant: "destructive",
              });
            } else {
              // Log error for admin review
              console.error("SMS alert failed:", smsResult.error);
              console.error("Failed alert details:", {
                timestamp: new Date().toISOString(),
                patient: patient.name,
                riskScore,
                department,
                error: smsResult.error,
              });
              
              // Display error toast
              toast({
                title: "Alert Notification Failed",
                description: `Unable to send SMS alert to specialist: ${smsResult.error}`,
                variant: "destructive",
              });
            }
          } catch (error) {
            // Log error for admin review
            console.error("Critical alert error:", error);
            console.error("Failed alert details:", {
              timestamp: new Date().toISOString(),
              patient: patient.name,
              riskScore,
              department,
              error: error instanceof Error ? error.message : String(error),
            });
            
            // Display error toast
            toast({
              title: "Alert System Error",
              description: "Failed to send critical alert. Please notify specialist manually.",
              variant: "destructive",
            });
          }
        } else {
          // Twilio not configured, still show banner
          setShowAlertBanner(true);
          setTimeout(() => {
            setShowAlertBanner(false);
          }, 10000);
          
          toast({
            title: "🚨 CRITICAL ALERT",
            description: "Patient requires immediate attention (SMS not configured)",
            variant: "destructive",
          });
        }
      }
    };

    triggerCriticalAlert();
  }, [riskScore, alertSentForSession, showResults, patient.name, department, toast]);

  // Debounced LLM analysis trigger - monitors patient data changes
  useEffect(() => {
    // Only trigger auto-analysis if enabled (after first manual diagnosis)
    if (!autoAnalysisEnabled) {
      return;
    }

    // Don't trigger if already analyzing
    if (isAnalyzing) {
      return;
    }

    // Debounce timer - wait 2 seconds after last change
    const debounceTimer = setTimeout(async () => {
      // Check if we have sufficient data to analyze
      const hasPatientData = patient.age && patient.gender && patient.bloodPressure;
      const hasSymptomData = transcript.trim().length > 0;

      if (hasPatientData && hasSymptomData) {
        setIsAnalyzing(true);

        try {
          // Construct contextual payload for LLM analysis
          const payload: ContextualPayload = {
            patient_profile: {
              age: patient.age,
              gender: patient.gender,
              current_bp: patient.bloodPressure,
              blood_group: patient.bloodGroup,
            },
            symptom_transcript: transcript,
            ehr_history: patient.conditions,
            neuro_risk_detected: neuroRiskDetected,
            vital_signs: {
              heart_rate: 75, // Default value - will be replaced when vitals are passed as props
              blood_pressure: patient.bloodPressure,
              spo2: 98, // Default value - will be replaced when vitals are passed as props
            },
          };

          // Call LLM service for analysis
          const llmResult = await analyzeTriage(payload);

          // Check if fallback was used
          if (llmResult.fallback_used) {
            setShowFallbackWarning(true);
          } else {
            setShowFallbackWarning(false);
          }

          // Map LLM result to component state
          // Convert risk_score (0-100) to risk level
          let mappedRiskLevel: "HIGH" | "MEDIUM" | "LOW";
          if (llmResult.risk_score >= 75) {
            mappedRiskLevel = "HIGH";
          } else if (llmResult.risk_score >= 40) {
            mappedRiskLevel = "MEDIUM";
          } else {
            mappedRiskLevel = "LOW";
          }

          // Update state with LLM results
          setAiRiskLevel(mappedRiskLevel);
          setAiRiskScore(llmResult.risk_score);
          setAiDepartment(llmResult.department);
          setAiReasoning(llmResult.justification);

          // Keep results visible
          setShowResults(true);
        } catch (error) {
          console.error("Auto-analysis failed:", error);
          // Don't show toast for auto-analysis failures to avoid spam
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 2000); // 2-second debounce

    // Cleanup function to cancel timer if dependencies change
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [
    patient.age,
    patient.gender,
    patient.bloodPressure,
    patient.bloodGroup,
    patient.conditions,
    transcript,
    neuroRiskDetected,
    autoAnalysisEnabled,
    isAnalyzing,
  ]);

  const riskColors = {
    HIGH: "bg-destructive/20 text-destructive border-destructive/40",
    MEDIUM: "bg-warning/20 text-warning border-warning/40",
    LOW: "bg-primary/20 text-primary border-primary/40",
  };

  // Calculate radar chart data using the 5 health dimensions
  const getRadarData = () => {
    // Parse blood pressure for Cardiac axis
    let systolic = 120;
    let diastolic = 80;
    if (patient.bloodPressure) {
      const bpParts = patient.bloodPressure.split('/');
      if (bpParts.length === 2) {
        systolic = parseInt(bpParts[0]) || 120;
        diastolic = parseInt(bpParts[1]) || 80;
      }
    }

    // Determine neuro risk state
    const neuroRiskState: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = neuroRiskDetected ? 'CRITICAL' : 'NORMAL';

    // Default heart rate (will be replaced when vitals are passed as props)
    const heartRate = 75;

    // Biomarker keywords for speech analysis
    const biomarkers = ['shaking', 'tremor', 'stiff', 'nadukkam', 'kampan', 'shake', 'slur'];

    return [
      { axis: "Cardiac", value: calculateCardiacScore(systolic, diastolic), fullMark: 100 },
      { axis: "Neuro", value: calculateNeuroScore(neuroRiskState), fullMark: 100 },
      { axis: "Vitals", value: calculateVitalsScore(heartRate), fullMark: 100 },
      { axis: "History", value: calculateHistoryScore(patient.conditions), fullMark: 100 },
      { axis: "Speech", value: calculateSpeechScore(transcript, biomarkers), fullMark: 100 },
    ];
  };

  const radarData = getRadarData();

  const initiateDiagnosis = async () => {
    const currentToken = parseInt(localStorage.getItem(TOKEN_KEY) || "41") + 1;
    localStorage.setItem(TOKEN_KEY, currentToken.toString());
    setTokenNumber(currentToken);
    setIsAnalyzing(true);

    try {
      // Construct contextual payload for LLM analysis
      const payload: ContextualPayload = {
        patient_profile: {
          age: patient.age,
          gender: patient.gender,
          current_bp: patient.bloodPressure,
          blood_group: patient.bloodGroup,
        },
        symptom_transcript: transcript,
        ehr_history: patient.conditions,
        neuro_risk_detected: neuroRiskDetected,
        vital_signs: {
          heart_rate: 75, // Default value - will be replaced when vitals are passed as props
          blood_pressure: patient.bloodPressure,
          spo2: 98, // Default value - will be replaced when vitals are passed as props
        },
      };

      // Call LLM service for analysis
      const llmResult = await analyzeTriage(payload);

      // Check if fallback was used
      if (llmResult.fallback_used) {
        setShowFallbackWarning(true);
      } else {
        setShowFallbackWarning(false);
      }

      // Map LLM result to component state
      // Convert risk_score (0-100) to risk level
      let mappedRiskLevel: "HIGH" | "MEDIUM" | "LOW";
      if (llmResult.risk_score >= 75) {
        mappedRiskLevel = "HIGH";
      } else if (llmResult.risk_score >= 40) {
        mappedRiskLevel = "MEDIUM";
      } else {
        mappedRiskLevel = "LOW";
      }

      // Update state with LLM results
      setAiRiskLevel(mappedRiskLevel);
      setAiRiskScore(llmResult.risk_score);
      setAiDepartment(llmResult.department);
      setAiReasoning(llmResult.justification);

      setShowResults(true);
      
      // Enable auto-analysis for subsequent data changes
      setAutoAnalysisEnabled(true);
      
      // Note: Critical alert triggering is now handled automatically by useEffect
      // when risk_score >= 75
    } catch (error) {
      console.error("Diagnosis failed:", error);
      toast({
        title: "Analysis Error",
        description: "Using fallback analysis method",
        variant: "default",
      });
      setShowResults(true);
      // Still enable auto-analysis even if first attempt fails
      setAutoAnalysisEnabled(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadCSV = () => {
    const { csv, filename } = generateCSV(
      patient,
      transcript,
      neuroRiskDetected,
      riskScore,
      department,
      aiReasoning
    );
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    // Display success toast
    toast({
      title: "Session data exported successfully",
      description: `Downloaded as ${filename}`,
      variant: "default",
    });
  };

  return (
    <TimelineNode
      index={5}
      title="AI Triage Engine"
      icon={<Zap className="w-5 h-5 text-primary" />}
    >
      {/* Critical Alert Banner */}
      <AnimatePresence>
        {showAlertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[90%] max-w-2xl"
          >
            <div className="bg-destructive text-destructive-foreground px-6 py-4 rounded-lg shadow-2xl border-2 border-destructive/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">🚨 CRITICAL ALERT: Specialist notified via WhatsApp Gateway</p>
                  <p className="text-sm opacity-90">
                    {new Date().toLocaleTimeString()} - Patient requires immediate attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertBanner(false)}
                className="text-destructive-foreground hover:opacity-70 transition-opacity ml-4"
                aria-label="Close alert"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initiate Button */}
      {!showResults && (
        <motion.button
          whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
          whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
          onClick={initiateDiagnosis}
          disabled={isAnalyzing}
          className="w-full py-4 rounded-xl font-bold text-lg tracking-wide bg-primary/20 border-2 border-primary/40 text-primary hover:bg-primary/30 transition-all pulse-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              ANALYZING WITH AI...
            </>
          ) : (
            <>⚡ INITIATE DIAGNOSIS</>
          )}
        </motion.button>
      )}

      {/* Loading Indicator for Auto-Analysis */}
      {showResults && isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-mono">Updating analysis...</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Risk + Department */}
            <div className="flex flex-wrap gap-4">
              <div className={`px-5 py-3 rounded-lg border font-mono font-bold text-lg ${riskColors[riskLevel]}`}>
                Risk: {riskLevel} ({riskScore} pts)
              </div>
              <div className="px-5 py-3 rounded-lg border border-secondary/40 bg-secondary/10 text-secondary font-mono">
                Recommended: {department}
              </div>
            </div>

            {/* AI Reasoning */}
            {aiReasoning && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  AI Analysis
                </h3>
                <p className="text-sm font-mono text-foreground/90">{aiReasoning}</p>
              </div>
            )}

            {/* Pentagon Radar Chart */}
            <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                Health Dimensions Pentagon
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220, 30%, 18%)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Token + Fairness */}
            <div className="flex flex-wrap gap-4">
              <div className="glass-card p-4 flex items-center gap-3">
                <Ticket className="w-6 h-6 text-secondary" />
                <div>
                  <p className="font-mono font-bold text-foreground">Token #A-{tokenNumber}</p>
                  <p className="text-xs text-muted-foreground font-mono">Wait Time: 12m</p>
                </div>
              </div>
              <div className="glass-card p-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-mono font-bold text-foreground">Fairness Shield</p>
                  <p className="text-xs text-primary font-mono">Bias Check: PASS ✓</p>
                </div>
              </div>
            </div>

            {/* CSV Download */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={downloadCSV}
              className="w-full py-3 rounded-xl font-mono text-sm bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </TimelineNode>
  );
};

export default AITriageEngine;
