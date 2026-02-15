interface PatientVitals {
  age: string;
  gender: string;
  bloodPressure: string;
  bloodGroup: string;
  conditions: string;
}

interface AITriageResult {
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  department: string;
  reasoning: string;
}

/**
 * Analyzes patient symptoms and vitals using Hugging Face AI model
 * Falls back to rule-based logic if API fails
 */
export async function analyzeSymptomsWithAI(
  symptoms: string,
  vitals: PatientVitals,
  neuroRiskDetected: boolean
): Promise<AITriageResult> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // If no API key, fall back to rule-based logic immediately
  if (!apiKey) {
    console.warn("Hugging Face API key not found, using rule-based logic");
    return fallbackRuleBasedAnalysis(symptoms, vitals, neuroRiskDetected);
  }

  try {
    // Construct the prompt for the AI model
    const prompt = constructPrompt(symptoms, vitals, neuroRiskDetected);

    // Call Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.3,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the AI response
    const aiResult = parseAIResponse(data);
    
    // Validate the result, fall back if invalid
    if (!aiResult || !isValidTriageResult(aiResult)) {
      console.warn("Invalid AI response, falling back to rule-based logic");
      return fallbackRuleBasedAnalysis(symptoms, vitals, neuroRiskDetected);
    }

    return aiResult;
  } catch (error) {
    console.error("AI analysis failed:", error);
    // Seamlessly fall back to rule-based logic
    return fallbackRuleBasedAnalysis(symptoms, vitals, neuroRiskDetected);
  }
}

/**
 * Constructs a detailed prompt for the AI model
 */
function constructPrompt(
  symptoms: string,
  vitals: PatientVitals,
  neuroRiskDetected: boolean
): string {
  return `You are a medical triage AI assistant. Analyze the following patient data and provide a triage assessment.

Patient Vitals:
- Age: ${vitals.age || "Not provided"}
- Gender: ${vitals.gender || "Not provided"}
- Blood Pressure: ${vitals.bloodPressure || "Not provided"}
- Blood Group: ${vitals.bloodGroup || "Not provided"}
- Pre-existing Conditions: ${vitals.conditions || "None"}
- Neurological Risk Detected: ${neuroRiskDetected ? "Yes" : "No"}

Patient Symptoms:
${symptoms || "No symptoms described"}

Based on this information, provide a triage assessment in the following JSON format:
{
  "riskLevel": "HIGH" or "MEDIUM" or "LOW",
  "department": "recommended department name",
  "reasoning": "brief explanation of the assessment"
}

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Parses the AI model response and extracts the triage result
 */
function parseAIResponse(data: any): AITriageResult | null {
  try {
    // Handle array response from Hugging Face
    const responseText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    
    if (!responseText) {
      return null;
    }

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Normalize risk level to uppercase
    if (parsed.riskLevel) {
      parsed.riskLevel = parsed.riskLevel.toUpperCase();
    }

    return parsed as AITriageResult;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}

/**
 * Validates that the AI result has all required fields
 */
function isValidTriageResult(result: any): result is AITriageResult {
  return (
    result &&
    typeof result === "object" &&
    ["HIGH", "MEDIUM", "LOW"].includes(result.riskLevel) &&
    typeof result.department === "string" &&
    typeof result.reasoning === "string"
  );
}

/**
 * Rule-based fallback logic for triage analysis
 */
function fallbackRuleBasedAnalysis(
  symptoms: string,
  vitals: PatientVitals,
  neuroRiskDetected: boolean
): AITriageResult {
  let riskScore = 0;
  let reasoning = "Assessment based on clinical guidelines: ";
  const reasons: string[] = [];

  // Parse blood pressure
  if (vitals.bloodPressure) {
    const bpParts = vitals.bloodPressure.split("/");
    if (bpParts.length === 2) {
      const systolic = parseInt(bpParts[0]);
      const diastolic = parseInt(bpParts[1]);

      if (systolic > 160 || diastolic > 100) {
        riskScore += 30;
        reasons.push("elevated blood pressure");
      }
    }
  }

  // Neuro-risk detection
  if (neuroRiskDetected) {
    riskScore += 40;
    reasons.push("neurological biomarkers detected");
  }

  // Symptom analysis
  const lowerSymptoms = symptoms.toLowerCase();
  const hasChestPain = /chest\s*pain/i.test(symptoms);
  const hasTremor = /tremor|shaking|stiff/i.test(symptoms);

  if (hasChestPain) {
    riskScore += 50;
    reasons.push("chest pain reported");
  }

  if (hasTremor) {
    riskScore += 20;
    reasons.push("tremor symptoms");
  }

  // Age factor
  const age = parseInt(vitals.age) || 0;
  if (age > 60) {
    riskScore += 10;
    reasons.push("advanced age");
  }

  // Pre-existing conditions
  if (vitals.conditions && vitals.conditions.trim().length > 0) {
    riskScore += 15;
    reasons.push("pre-existing conditions");
  }

  // Determine risk level
  let riskLevel: "HIGH" | "MEDIUM" | "LOW";
  if (riskScore >= 60 || hasChestPain) {
    riskLevel = "HIGH";
  } else if (riskScore >= 30) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  // Determine department
  let department: string;
  if (hasChestPain) {
    department = "Cardiology";
  } else if (hasTremor || neuroRiskDetected) {
    department = "Neurology";
  } else if (riskScore >= 30) {
    department = "Internal Medicine";
  } else {
    department = "General Medicine";
  }

  // Build reasoning
  if (reasons.length > 0) {
    reasoning += reasons.join(", ") + ".";
  } else {
    reasoning += "no significant risk factors identified.";
  }

  return {
    riskLevel,
    department,
    reasoning,
  };
}
