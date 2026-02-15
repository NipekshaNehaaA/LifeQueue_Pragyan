# 🏥 Pragyan AI Health Command Center

**Pragyan AI Health Command Center** is an elite medical intelligence platform utilizing a proprietary **Multi-Modal ML Engine** to synthesize real-time biosensor streams from **BioSentinel** wearables into high-precision triage, predictive risk stratification, and autonomous clinical routing across five critical axes.

---

## 🚀 12 Core Innovations & Features

1.  💓 **Real-Time Vitals "Breathing" Synchronization**
    A custom-built data pipeline that streams live **ECG, Heart Rate, and SpO2** data from wearable hardware directly into the AI engine for instantaneous analysis and visualization.

2.  ⌚ **BioSentinel Wearable Integration**
    Seamless hardware-to-software bridging using an **ESP32-based AI-powered wearable** that monitors vitals to predict life-threatening conditions like Sepsis before symptoms manifest.

3.  🗣️ **Vocal Biomarker Analysis**
    A proprietary ML module that analyzes **speech patterns, prosody, and tremors** to detect early-stage Neurological distress, such as Parkinson’s or stroke symptoms.

4.  📊 **Dynamic Pentagon Radar Triage**
    A unique **5-axis visualization tool** that maps risk across **Cardiac, Neuro, Vitals, History, and Speech** domains, providing a holistic view of patient health at a glance.

5.  📂 **Context-Aware EHR Integration**
    The engine pulls longitudinal data from Electronic Health Records (EHR)—like a patient’s **diabetic history**—to intelligently adjust risk scores for acute symptoms like fever.

6.  🧠 **ML-Based Risk Scoring (0-100)**
    A sophisticated algorithm that weighs vital signs against historical risk multipliers (e.g., **Age 55 + Diabetes**) to provide a precise, data-driven triage score.

7.  🏥 **Autonomous Routing Logic**
    Automatically assigns patients to specialized departments (**Cardiology, Neurology, Gastroenterology**) based on complex ML-detected symptom clusters, reducing ER wait times.

8.  📝 **Automated Medical Justification**
    Generates clinical-grade reasoning for every triage decision, assisting doctors with a transparent **"white-box" AI approach** that explains *why* a patient was flagged.

9.  📉 **Predictive Crisis Detection**
    Utilizes **projectile dynamics and behavioral analysis models** to identify the onset of Hypertensive Crises or cardiac events before they become critical.

10. 🚨 **Zero-Touch Emergency Alerts**
    An automated alert system that triggers high-priority notifications (via **WhatsApp/SMS**) to on-call specialists when risk scores exceed a **75% threshold**.

11. 🔗 **Multi-Step Assessment Nodes**
    A structured **5-module intake process** that separates history, symptoms, and vitals to ensure no critical data point is missed by the ML model.

12. 🔄 **Self-Evolving Active Learning**
    The model is not static; it employs an **online learning framework** where every patient interaction and physician feedback loop serves as a new training data point, continuously refining diagnostic accuracy and risk weightings over time.

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
