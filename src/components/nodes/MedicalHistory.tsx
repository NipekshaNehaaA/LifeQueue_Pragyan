import { useState, useRef, DragEvent } from "react";
import { FileText, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import TimelineNode from "@/components/TimelineNode";
import {
  extractTextFromImage,
  analyzeMedicalText,
  extractStructuredData,
  type ExtractedMedicalData,
  type OCRProgress,
} from "@/services/ocrService";

type Status = "idle" | "scanning" | "done" | "error" | "timeout";

const MedicalHistory = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedMedicalData[]>([]);
  const [rawText, setRawText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = async (file: File) => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setStatus("error");
      setFileName(file.name);
      return;
    }

    setFileName(file.name);
    setStatus("scanning");
    setOcrProgress(0);
    setOcrStatus("Initializing OCR...");
    setShowManualInput(false);

    try {
      // Extract text from image using OCR
      const text = await extractTextFromImage(file, (progress: OCRProgress) => {
        setOcrProgress(Math.round(progress.progress * 100));
        setOcrStatus(progress.status);
      });

      setRawText(text);

      // Analyze the extracted text for medical keywords
      const keywords = analyzeMedicalText(text);
      const structuredData = extractStructuredData(keywords);

      if (structuredData.length === 0) {
        // No medical data found, show manual input option
        setStatus("timeout");
        setShowManualInput(true);
      } else {
        setExtractedData(structuredData);
        setStatus("done");
      }
    } catch (error) {
      console.error("OCR failed:", error);
      setStatus("timeout");
      setShowManualInput(true);
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;

    setRawText(manualText);
    const keywords = analyzeMedicalText(manualText);
    const structuredData = extractStructuredData(keywords);

    if (structuredData.length === 0) {
      setExtractedData([
        {
          diagnosis: "Manual Entry",
          medication: "See raw text",
        },
      ]);
    } else {
      setExtractedData(structuredData);
    }

    setStatus("done");
    setShowManualInput(false);
  };

  const resetScanner = () => {
    setStatus("idle");
    setFileName("");
    setExtractedData([]);
    setRawText("");
    setManualText("");
    setShowManualInput(false);
    setOcrProgress(0);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndProcess(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcess(file);
  };

  return (
    <TimelineNode
      index={3}
      title="Medical History (EHR Validation)"
      icon={<FileText className="w-5 h-5 text-primary" />}
    >
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/40 bg-muted/20"
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop medical records here, or{" "}
          <span className="text-primary underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports image files (PNG, JPG, WEBP)
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileInput}
        />
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 font-mono text-sm"
          >
            <AlertCircle className="w-5 h-5" />
            ❌ Invalid File: "{fileName}" — Only image files accepted
          </motion.div>
        )}

        {status === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-6 rounded-lg bg-muted/30 border border-primary/20"
          >
            <div className="flex items-center gap-3 font-mono text-sm text-primary mb-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Scanning "{fileName}"...
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{ocrStatus}</span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${ocrProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {status === "timeout" && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-4"
          >
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning flex items-center gap-2 font-mono text-sm">
              <AlertCircle className="w-5 h-5" />
              OCR timeout or no medical data found
            </div>

            {showManualInput && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-mono">
                  Please paste the medical report text manually:
                </p>
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste medical report text here..."
                  className="min-h-[120px] bg-muted/50 border-border/50 focus:border-primary/50 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleManualSubmit}
                    className="flex-1"
                    disabled={!manualText.trim()}
                  >
                    Analyze Text
                  </Button>
                  <Button onClick={resetScanner} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-mono text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Medical Data Extracted
              </div>
              <Button onClick={resetScanner} variant="ghost" size="sm">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>

            {/* Extracted Data Table */}
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      Medication
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.length > 0 ? (
                    extractedData.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-secondary">
                          {row.date || "N/A"}
                        </td>
                        <td className="px-4 py-3">{row.diagnosis}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {row.medication || "N/A"}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {row.status || "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No medical data found in the document
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Raw Text Preview */}
            {rawText && (
              <details className="group">
                <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
                  View Raw OCR Text ({rawText.length} characters)
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 max-h-40 overflow-y-auto">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {rawText}
                  </pre>
                </div>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TimelineNode>
  );
};

export default MedicalHistory;
