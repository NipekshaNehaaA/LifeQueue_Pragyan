import Tesseract from "tesseract.js";

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface MedicalKeyword {
  keyword: string;
  category: "condition" | "status" | "medication" | "other";
  context?: string;
}

// Medical keywords to search for in OCR text
const MEDICAL_KEYWORDS = {
  conditions: [
    "hypertension",
    "diabetes",
    "hyperlipidemia",
    "asthma",
    "copd",
    "arthritis",
    "thyroid",
    "anemia",
    "migraine",
    "depression",
    "anxiety",
    "obesity",
    "cancer",
    "heart disease",
    "kidney disease",
    "liver disease",
  ],
  status: [
    "normal",
    "abnormal",
    "critical",
    "elevated",
    "high",
    "low",
    "positive",
    "negative",
    "stable",
    "unstable",
  ],
  medications: [
    "amlodipine",
    "metformin",
    "atorvastatin",
    "lisinopril",
    "aspirin",
    "insulin",
    "levothyroxine",
    "omeprazole",
    "losartan",
    "gabapentin",
  ],
};

/**
 * Performs OCR on an image file and extracts text
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set timeout for OCR process (10 seconds)
    const timeout = setTimeout(() => {
      reject(new Error("OCR timeout - process took longer than 10 seconds"));
    }, 10000);

    Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (onProgress && m.status) {
          onProgress({
            status: m.status,
            progress: m.progress || 0,
          });
        }
      },
    })
      .then(({ data: { text } }) => {
        clearTimeout(timeout);
        resolve(text);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Analyzes extracted text for medical keywords
 */
export function analyzeMedicalText(text: string): MedicalKeyword[] {
  const lowerText = text.toLowerCase();
  const findings: MedicalKeyword[] = [];
  const lines = text.split("\n");

  // Search for conditions
  MEDICAL_KEYWORDS.conditions.forEach((condition) => {
    if (lowerText.includes(condition)) {
      // Find the line containing the keyword for context
      const contextLine = lines.find((line) =>
        line.toLowerCase().includes(condition)
      );
      findings.push({
        keyword: condition.charAt(0).toUpperCase() + condition.slice(1),
        category: "condition",
        context: contextLine?.trim(),
      });
    }
  });

  // Search for status indicators
  MEDICAL_KEYWORDS.status.forEach((status) => {
    if (lowerText.includes(status)) {
      const contextLine = lines.find((line) =>
        line.toLowerCase().includes(status)
      );
      findings.push({
        keyword: status.charAt(0).toUpperCase() + status.slice(1),
        category: "status",
        context: contextLine?.trim(),
      });
    }
  });

  // Search for medications
  MEDICAL_KEYWORDS.medications.forEach((medication) => {
    if (lowerText.includes(medication)) {
      const contextLine = lines.find((line) =>
        line.toLowerCase().includes(medication)
      );
      findings.push({
        keyword: medication.charAt(0).toUpperCase() + medication.slice(1),
        category: "medication",
        context: contextLine?.trim(),
      });
    }
  });

  return findings;
}

/**
 * Extracts structured medical data from text
 */
export interface ExtractedMedicalData {
  date?: string;
  diagnosis: string;
  medication?: string;
  status?: string;
}

export function extractStructuredData(
  keywords: MedicalKeyword[]
): ExtractedMedicalData[] {
  const data: ExtractedMedicalData[] = [];

  // Group findings by context
  const conditionKeywords = keywords.filter((k) => k.category === "condition");
  const medicationKeywords = keywords.filter(
    (k) => k.category === "medication"
  );
  const statusKeywords = keywords.filter((k) => k.category === "status");

  // Create entries for each condition found
  conditionKeywords.forEach((condition) => {
    const entry: ExtractedMedicalData = {
      diagnosis: condition.keyword,
    };

    // Try to find related medication
    const relatedMed = medicationKeywords.find(
      (med) =>
        med.context &&
        condition.context &&
        Math.abs(
          med.context.indexOf(condition.keyword) -
            condition.context.indexOf(condition.keyword)
        ) < 100
    );
    if (relatedMed) {
      entry.medication = relatedMed.keyword;
    }

    // Try to find related status
    const relatedStatus = statusKeywords.find(
      (status) =>
        status.context &&
        condition.context &&
        status.context.includes(condition.keyword)
    );
    if (relatedStatus) {
      entry.status = relatedStatus.keyword;
    }

    // Try to extract date from context
    if (condition.context) {
      const dateMatch = condition.context.match(
        /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/
      );
      if (dateMatch) {
        entry.date = dateMatch[0];
      }
    }

    data.push(entry);
  });

  // If no conditions found but medications exist, create entries for medications
  if (data.length === 0 && medicationKeywords.length > 0) {
    medicationKeywords.forEach((med) => {
      data.push({
        diagnosis: "Medication Found",
        medication: med.keyword,
      });
    });
  }

  // If still no data, create entries for status keywords
  if (data.length === 0 && statusKeywords.length > 0) {
    statusKeywords.forEach((status) => {
      data.push({
        diagnosis: "Status Indicator",
        status: status.keyword,
      });
    });
  }

  return data;
}
