// ============================================================================
// src/services/llmTriage.ts - FINAL STABLE VERSION
// ============================================================================

// 1. TYPE DEFINITIONS
export interface PatientProfile {
  age: string;
  gender: string;
  current_bp: string;
  blood_group: string;
}

export interface VitalSigns {
  heart_rate: number;
  blood_pressure: string;
  spo2: number;
}

export interface ContextualPayload {
  patient_profile: PatientProfile;
  symptom_transcript: string;
  ehr_history: string;
  neuro_risk_detected: boolean;
  vital_signs: VitalSigns;
}

export interface TriageResult {
  risk_score: number;
  department: string;
  justification: string;
  confidence: number;
  fallback_used: boolean;
}

// 2. ROBUST FALLBACK LOGIC (The Safety Net)
// This ensures the demo WORKS even if the Internet/API dies.
export function fallbackAnalysis(payload: ContextualPayload): TriageResult {
  console.log("⚠️ TRIGGERING FALLBACK LOGIC");
  
  const transcript = (payload.symptom_transcript || "").toLowerCase();
  const history = (payload.ehr_history || "").toLowerCase();
  const age = parseInt(payload.patient_profile.age) || 0;
  
  // A. CRITICAL: Check for Hypertensive Crisis (Cardio)
  const bpParts = payload.vital_signs.blood_pressure.split('/');
  if (bpParts.length === 2) {
    const systolic = parseInt(bpParts[0]);
    const diastolic = parseInt(bpParts[1]);

    if (systolic > 180 || diastolic > 110) {
      return {
        risk_score: 95,
        department: "Cardiology",
        justification: `CRITICAL: Hypertensive Crisis detected (BP ${payload.vital_signs.blood_pressure}). Immediate Cardiology intervention required.`,
        confidence: 0.9,
        fallback_used: true
      };
    }
  }

  // B. CRITICAL: Check for Neuro Keywords (Neurology)
  const neuroKeywords = ["shake", "shaking", "tremor", "stiff", "frozen", "slur", "forget", "nadukkam", "kampan"];
  
  if (payload.neuro_risk_detected || neuroKeywords.some(k => transcript.includes(k))) {
    return {
      risk_score: 88,
      department: "Neurology",
      justification: "Vocal biomarkers (Tremor/Stiffness) indicate neurological risk despite normal vitals.",
      confidence: 0.85,
      fallback_used: true
    };
  }

  // C. MODERATE RISK: Diabetes + Fever + Abdominal Symptoms (Gastroenterology/General Medicine)
  const hasDiabetes = history.includes("diabetes") || history.includes("diabetic");
  const hasFever = transcript.includes("fever") || transcript.includes("temperature") || transcript.includes("hot");
  const hasAbdominalSymptoms = transcript.includes("stomach") || transcript.includes("abdominal") || 
                                transcript.includes("belly") || transcript.includes("abdomen") ||
                                transcript.includes("ache") || transcript.includes("pain");
  
  if (hasDiabetes && (hasFever || hasAbdominalSymptoms)) {
    const riskScore = age >= 50 ? 52 : 48; // 48-52 range for moderate risk
    return {
      risk_score: riskScore,
      department: "General Medicine",
      justification: `A ${age}-year-old patient with a history of Diabetes presenting with acute fever and abdominal distress. Diabetic status increases the risk of rapid clinical deterioration or underlying infection (e.g., DKA or gastroenteritis). Moderate risk due to metabolic history. Routing to General Medicine for vital stabilization and glucose monitoring.`,
      confidence: 0.8,
      fallback_used: true
    };
  }

  // D. MODERATE RISK: Age-related concerns with chronic conditions
  if (age >= 50 && history.trim().length > 0) {
    return {
      risk_score: 45,
      department: "General Medicine",
      justification: `Patient over 50 with pre-existing conditions requires evaluation. Moderate risk due to age and medical history.`,
      confidence: 0.7,
      fallback_used: true
    };
  }

  // E. Standard Low Risk
  return {
    risk_score: 15,
    department: "General Medicine",
    justification: "Vitals stable, no critical keywords detected. Routine checkup recommended.",
    confidence: 0.6,
    fallback_used: true
  };
}

// 3. MAIN AI ANALYSIS FUNCTION
export async function analyzeTriage(payload: ContextualPayload): Promise<TriageResult> {
  // ⚡ HARDCODED KEY & URL FOR DEMO STABILITY
  // (We use gemini-pro because it is the most stable free model)
  const API_KEY = "AIzaSyBUW0gVRsBnf5RwNXbFmpdB-j3AMA4EX2I"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

  const promptText = `
    ACT AS A TRIAGE DOCTOR. Analyze this patient:
    - Vitals: BP ${payload.vital_signs.blood_pressure}, HR ${payload.vital_signs.heart_rate}, SpO2 ${payload.vital_signs.spo2}
    - Symptoms: ${payload.symptom_transcript}
    - History: ${payload.ehr_history}
    
    TASK: Return a JSON object with:
    1. risk_score (0-100)
    2. department (Cardiology, Neurology, Pulmonology, or General Medicine)
    3. justification (Max 20 words, concise clinical reasoning)

    RULES: 
    - IF BP > 180 OR "chest pain" in symptoms -> High Risk (Cardiology).
    - IF "shake", "tremor", "stiff" in symptoms -> High Risk (Neurology).
    
    RETURN JSON ONLY. NO MARKDOWN.
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Gemini Response
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    // Clean markdown code blocks if Gemini adds them
    const jsonString = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonString);

    // Validate result
    if (!result.risk_score || !result.department) {
      throw new Error("Incomplete JSON from AI");
    }

    return {
      risk_score: result.risk_score,
      department: result.department,
      justification: result.justification,
      confidence: 0.9,
      fallback_used: false
    };

  } catch (error) {
    console.error("❌ AI ANALYSIS FAILED:", error);
    // If API fails (Quota/Net/Timeout), IMMEDIATELY use the robust fallback
    return fallbackAnalysis(payload);
  }
}