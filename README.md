# 🏥 Pragyan AI Health Command Center

**Pragyan AI Health Command Center** is an elite medical intelligence platform utilizing a proprietary **Multi-Modal ML Engine** to synthesize real-time biosensor streams from **BioSentinel** wearables into high-precision triage, predictive risk stratification, and autonomous clinical routing across five critical axes.

---

## 🚀 Key Innovations & Features

* **🧠 ML-Driven Hybrid Triage Engine**: A sophisticated multi-modal architecture that synthesizes **high-frequency biosensor data** with clinical linguistics for real-time differential diagnosis.
* **⌚ BioSentinel Wearable Integration**: Seamless hardware-to-software bridging via an **AI-powered wearable** that monitors vitals to predict life-threatening conditions like Sepsis.
* **📊 Dynamic Pentagon Radar Triage**: A unique **5-axis visualization tool** mapping clinical risk across **Cardiac, Neuro, Vitals, History, and Speech** domains.
* **🗣️ Vocal Biomarker Analysis**: Proprietary ML modules that analyze **speech patterns and prosody** to detect early-stage neurological distress and stroke symptoms.
* **❤️ Real-Time Vitals Synchronization**: Custom data pipeline streaming live **ECG, Heart Rate, and SpO2** data directly into the AI engine for instantaneous analysis.
* **📂 Context-Aware EHR Integration**: The engine intelligently adjusts risk scores by cross-referencing acute symptoms with **longitudinal medical history** (e.g., Diabetic Status + Age factors).
* **🏥 Autonomous Routing Protocol**: Instantly assigns patients to specialized departments (**Cardiology, Neurology, Gastroenterology**) based on complex ML-detected symptom clusters.
* **📉 Predictive Crisis Detection**: Identifies the onset of **hypertensive crises** or cardiac events using advanced behavioral analysis and physiological modeling.
* **📝 Automated Clinical Justification**: Generates transparent, **"white-box" AI reasoning** for every triage decision to assist medical professionals with diagnostic clarity.
* **⚙️ Hardware-in-the-Loop Simulation**: Integrated hardware prototype mimicking **physical interactions** to validate sensor accuracy and material wear under stress.
* **🚨 Zero-Touch Emergency Alerts**: Automated high-priority notification system (via **SMS/WhatsApp**) triggered instantly when risk scores exceed critical thresholds.
* **🔗 Multi-Step Modular Intake**: A structured **5-module data acquisition system** ensuring comprehensive coverage of patient history, symptoms, and real-time vitals.

---

## 🛠️ Tech Stack

* **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Recharts
* **Backend & ML**: Node.js, FastAPI, **Gemini-Pro / Llama-3 (via Groq)**
* **Hardware**: ESP32, ESP8266, LDR modules, MPU6050, MAX6675
* **Testing**: Vitest with **Fast-Check** for property-based reliability

---

## 📂 Project Structure

| Path | Description |
| :--- | :--- |
| `src/services/llmTriage.ts` | **Core ML-driven triage logic** and API integration |
| `src/components/nodes/` | **Modular patient intake system** (Nodes 1-5) |
| `hardware/` | **BioSentinel firmware** and Li-Fi data transfer sketches |
| `src/services/llmTriage.test.ts` | **Automated reliability** and safety property-based tests |

---

## 🏁 Getting Started

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/pragyan-health-hub.git](https://github.com/your-username/pragyan-health-hub.git)
cd pragyan-health-hub
