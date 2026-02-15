import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, BrainCircuit, AlertTriangle, ShieldCheck, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import TimelineNode from "@/components/TimelineNode";

interface Props {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  neuroRiskDetected: boolean;
  onNeuroRiskChange: (detected: boolean) => void;
}

const LANG_MAP: Record<string, string> = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
};

// Enhanced biomarker pattern from requirements - includes multilingual keywords
const BIOMARKER_PATTERN = /shaking|tremor|stiff|slur|shake|nadukkam|kampan/i;

const NeuroVoiceAnalyzer = ({ transcript, onTranscriptChange, neuroRiskDetected, onNeuroRiskChange }: Props) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("English");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const riskRef = useRef(false);
  const { toast } = useToast();

  // Check browser compatibility on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
    }
  }, []);

  // Check for biomarkers and update persistent risk flag
  useEffect(() => {
    if (!riskRef.current && BIOMARKER_PATTERN.test(transcript)) {
      riskRef.current = true;
      onNeuroRiskChange(true);
    }
  }, [transcript, onNeuroRiskChange]);

  // Sync riskRef with prop changes (for external resets)
  useEffect(() => {
    riskRef.current = neuroRiskDetected;
  }, [neuroRiskDetected]);

  const clearAlert = () => {
    riskRef.current = false;
    onNeuroRiskChange(false);
  };

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechError(null);
      return;
    }

    // Check browser compatibility
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition. Please type your symptoms manually.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[language] || "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let result = "";
      for (let i = 0; i < event.results.length; i++) {
        result += event.results[i][0].transcript + " ";
      }
      onTranscriptChange(transcript + result.trim() + " ");
      setSpeechError(null); // Clear any previous errors on success
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      
      // Handle different error types
      let errorMessage = "An error occurred with speech recognition.";
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
          setSpeechError(errorMessage);
          toast({
            title: "Microphone Permission Denied",
            description: "Please enable microphone access in your browser settings and try again.",
            variant: "destructive",
          });
          break;
        case 'no-speech':
          errorMessage = "No speech detected. Please try again.";
          toast({
            title: "No Speech Detected",
            description: "Please speak clearly into your microphone.",
            variant: "default",
          });
          break;
        case 'audio-capture':
          errorMessage = "No microphone found. Please connect a microphone and try again.";
          setSpeechError(errorMessage);
          toast({
            title: "No Microphone Found",
            description: "Please connect a microphone to use voice input.",
            variant: "destructive",
          });
          break;
        case 'network':
          errorMessage = "Network error. Please check your internet connection.";
          toast({
            title: "Network Error",
            description: "Speech recognition requires an internet connection.",
            variant: "destructive",
          });
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
          toast({
            title: "Speech Recognition Error",
            description: "An error occurred. Please try again or type manually.",
            variant: "destructive",
          });
      }
      
      console.error("Speech recognition error:", event.error, errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setSpeechError(null);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setSpeechError("Failed to start speech recognition. Please try again.");
      toast({
        title: "Failed to Start Recording",
        description: "Please try again or type your symptoms manually.",
        variant: "destructive",
      });
    }
  }, [isListening, language, transcript, onTranscriptChange, toast]);

  return (
    <TimelineNode
      index={2}
      title="Neuro-Voice Analyzer"
      icon={<BrainCircuit className="w-5 h-5 text-primary" />}
    >
      {/* Language selector */}
      <div className="mb-4">
        <Select value={language} onValueChange={setLanguage} disabled={!isSpeechSupported}>
          <SelectTrigger className="w-40 bg-muted/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LANG_MAP).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Browser Compatibility Warning */}
      {!isSpeechSupported && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-mono text-sm font-semibold">Speech Recognition Not Supported</p>
            <p className="font-mono text-xs opacity-90 mt-1">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari, or type your symptoms manually below.
            </p>
          </div>
        </motion.div>
      )}

      {/* Speech Error Message */}
      {speechError && isSpeechSupported && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-mono text-sm">{speechError}</p>
            <p className="font-mono text-xs opacity-80 mt-1">
              You can type your symptoms manually in the text area below.
            </p>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-warning hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Split layout: Mic + Textarea */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Mic button */}
        <div className="flex flex-col items-center justify-center gap-3 md:w-1/4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            disabled={!isSpeechSupported}
            className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              !isSpeechSupported
                ? "bg-muted/20 border-muted cursor-not-allowed opacity-50"
                : isListening
                ? "bg-destructive/20 border-destructive glow-border-emerald"
                : "bg-primary/10 border-primary/40 hover:border-primary"
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 text-destructive" />
            ) : (
              <Mic className="w-10 h-10 text-primary" />
            )}
          </motion.button>
          <span className="text-xs font-mono text-muted-foreground">
            {!isSpeechSupported 
              ? "Not supported" 
              : isListening 
              ? "Recording..." 
              : "Tap to speak"}
          </span>
        </div>

        {/* Textarea */}
        <div className="flex-1">
          <Textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Describe your symptoms here or use the microphone..."
            className="min-h-[160px] bg-muted/50 border-border/50 focus:border-primary/50 font-mono text-sm resize-none"
          />
        </div>
      </div>

      {/* Neuro-Guard Status Bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={neuroRiskDetected ? "risk" : "stable"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mt-4 p-3 rounded-lg flex items-center justify-between gap-3 font-mono text-sm ${
            neuroRiskDetected
              ? "bg-destructive/10 border border-destructive/30 text-destructive"
              : "bg-primary/10 border border-primary/30 text-primary"
          }`}
        >
          <div className="flex items-center gap-3">
            {neuroRiskDetected ? (
              <>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                ⚠️ ALERT: Parkinson's Biomarkers Detected
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                Neuro-Vitals Stable
              </>
            )}
          </div>
          {neuroRiskDetected && (
            <Button
              onClick={clearAlert}
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs hover:bg-destructive/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Alert
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </TimelineNode>
  );
};

export default NeuroVoiceAnalyzer;
