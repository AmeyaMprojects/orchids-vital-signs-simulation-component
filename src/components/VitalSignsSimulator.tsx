"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Thermometer, 
  Activity, 
  Wind, 
  Droplets, 
  Stethoscope, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVitalsContext } from "@/contexts/VitalsContext";

interface VitalRange {
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SCENARIO_LIMITS = {
  NORMAL: {
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
    hr: { min: 80, max: 120 },
    rr: { min: 20, max: 30 },
    cough: { min: 0, max: 0.15 },
    retractions: { min: 0, max: 0.05 },
  },
  PNEUMONIA: {
    temp: { min: 38.2, max: 40.0 },
    spo2: { min: 88, max: 94 },
    hr: { min: 130, max: 160 },
    rr: { min: 40, max: 60 },
    cough: { min: 0, max: 0.85 },
    retractions: { min: 0, max: 0.75 },
  },
};

const GLOBAL_RANGES: Record<string, VitalRange> = {
  temp: { min: 36.5, max: 40.0, step: 0.1, unit: "°C" },
  spo2: { min: 88, max: 100, step: 1, unit: "%" },
  hr: { min: 80, max: 160, step: 1, unit: "bpm" },
  rr: { min: 20, max: 60, step: 1, unit: "breaths/min" },
  cough: { min: 0, max: 1.0, step: 0.01, unit: "prob" },
  retractions: { min: 0, max: 1.0, step: 0.01, unit: "prob" },
};

interface Vitals {
  temp: number;
  spo2: number;
  hr: number;
  rr: number;
  cough: number;
  retractions: number;
}

interface VitalTrends {
  temp: 'up' | 'down' | 'stable';
  spo2: 'up' | 'down' | 'stable';
  hr: 'up' | 'down' | 'stable';
  rr: 'up' | 'down' | 'stable';
  cough: 'up' | 'down' | 'stable';
  retractions: 'up' | 'down' | 'stable';
}

interface SimulationResult {
  status: "Normal" | "Pneumonia" | "Borderline";
  message: string;
  color: string;
  icon: React.ReactNode;
}

const generateMockVitals = (): Vitals => {
  const scenarios = ['normal', 'pneumonia', 'borderline'];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  if (scenario === 'pneumonia') {
    return {
      temp: 38.2 + Math.random() * 1.8,
      spo2: 88 + Math.random() * 6,
      hr: 130 + Math.random() * 30,
      rr: 40 + Math.random() * 20,
      cough: Math.random() * 0.85,
      retractions: Math.random() * 0.75,
    };
  } else if (scenario === 'normal') {
    return {
      temp: 36.5 + Math.random() * 1.0,
      spo2: 95 + Math.random() * 5,
      hr: 80 + Math.random() * 40,
      rr: 20 + Math.random() * 10,
      cough: Math.random() * 0.15,
      retractions: Math.random() * 0.05,
    };
  } else {
    return {
      temp: 37 + Math.random() * 2,
      spo2: 90 + Math.random() * 8,
      hr: 90 + Math.random() * 50,
      rr: 25 + Math.random() * 25,
      cough: Math.random() * 0.5,
      retractions: Math.random() * 0.4,
    };
  }
};

export default function VitalSignsSimulator() {
  const { setVitals: setContextVitals } = useVitalsContext();
  
  const [vitals, setVitals] = useState<Vitals>({
    temp: 38.2,
    spo2: 92,
    hr: 130,
    rr: 38,
    cough: 1,
    retractions: 1,
  });
  const [trends, setTrends] = useState<VitalTrends>({
    temp: 'up',
    spo2: 'down',
    hr: 'up',
    rr: 'up',
    cough: 'stable',
    retractions: 'stable',
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastLog, setLastLog] = useState<Vitals | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        setVitals(currentVitals => {
          const newVitals = generateMockVitals();
          
          const newTrends: VitalTrends = {
            temp: newVitals.temp > currentVitals.temp ? 'up' : newVitals.temp < currentVitals.temp ? 'down' : 'stable',
            spo2: newVitals.spo2 > currentVitals.spo2 ? 'up' : newVitals.spo2 < currentVitals.spo2 ? 'down' : 'stable',
            hr: newVitals.hr > currentVitals.hr ? 'up' : newVitals.hr < currentVitals.hr ? 'down' : 'stable',
            rr: newVitals.rr > currentVitals.rr ? 'up' : newVitals.rr < currentVitals.rr ? 'down' : 'stable',
            cough: newVitals.cough > currentVitals.cough ? 'up' : newVitals.cough < currentVitals.cough ? 'down' : 'stable',
            retractions: newVitals.retractions > currentVitals.retractions ? 'up' : newVitals.retractions < currentVitals.retractions ? 'down' : 'stable',
          };
          setTrends(newTrends);
          analyzeVitals(newVitals);
          
          // Update context with new vitals
          setContextVitals({
            Temperature_C: newVitals.temp,
            Temperature_trend: newVitals.temp - currentVitals.temp,
            SpO2_percent: newVitals.spo2,
            SpO2_trend: newVitals.spo2 - currentVitals.spo2,
            HeartRate_bpm: newVitals.hr,
            HeartRate_trend: newVitals.hr - currentVitals.hr,
            RespRate_bpm: newVitals.rr,
            RespRate_trend: newVitals.rr - currentVitals.rr,
            Cough: newVitals.cough >= 0.5 ? 1 : 0,
            Retractions: newVitals.retractions >= 0.5 ? 1 : 0,
          });
          
          return newVitals;
        });
      }, 18000000); // 5 hours in milliseconds
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming]);
  
  const analyzeVitals = (currentVitals: Vitals) => {
    console.log("Simulation Values:", JSON.stringify(currentVitals, null, 2));
    setLastLog(currentVitals);
    let pneumoniaCount = 0;
    let normalCount = 0;

    const vitalsList: (keyof Vitals)[] = ["temp", "spo2", "hr", "rr", "cough", "retractions"];
    
    vitalsList.forEach(key => {
      const p = SCENARIO_LIMITS.PNEUMONIA[key];
      const n = SCENARIO_LIMITS.NORMAL[key];
      
      if (currentVitals[key] >= p.min && currentVitals[key] <= p.max) pneumoniaCount++;
      if (currentVitals[key] >= n.min && currentVitals[key] <= n.max) normalCount++;
    });

    if (pneumoniaCount >= 4) {
      setResult({
        status: "Pneumonia",
        message: "Likely Pneumonia Pattern: Lower oxygen levels, faster breathing, and fever together are commonly seen in pneumonia.",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="w-8 h-8 text-red-600" />
      });
    } else if (normalCount >= 4) {
      setResult({
        status: "Normal",
        message: "Normal Vital Pattern: All vital signs are within expected healthy ranges.",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      });
    } else {
      setResult({
        status: "Borderline",
        message: "Borderline / Needs Clinical Correlation: Some vitals are outside normal ranges but don't clearly indicate pneumonia.",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <AlertTriangle className="w-8 h-8 text-amber-600" />
      });
    }
  };

  const renderVitalCard = (label: string, key: keyof Vitals, icon: React.ReactNode) => {
    const config = GLOBAL_RANGES[key];
    const value = vitals[key];
    const trend = trends[key];

    const getTrendIcon = () => {
      if (trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
      if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
      return <Minus className="w-5 h-5 text-zinc-400" />;
    };

  return (
    <>
      <style>{`
        .vital-simulator {
          font-family: system-ui, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }
        h1 { 
          text-align: center; 
          color: #1e40af; 
          margin-bottom: 32px;
          font-size: 2.5rem;
        }
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          padding: 24px;
          margin-bottom: 32px;
        }
        .age-select-wrapper { 
          margin-bottom: 28px;
          background: #f0f9ff;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #2563eb;
        }
        .age-select-wrapper label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        select, .yes-no-select {
          padding: 10px 16px;
          font-size: 1.05rem;
          border-radius: 8px;
          border: 2px solid #d1d5db;
          width: 100%;
          max-width: 340px;
          background: white;
          font-weight: 500;
        }
        select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .sliders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px 32px;
        }
        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .slider-group label {
          font-weight: 600;
          color: #1f2937;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .value-display {
          color: #dc2626;
          font-weight: bold;
          min-width: 70px;
          text-align: right;
        }
        input[type="range"] {
          width: 100%;
          height: 8px;
          accent-color: #3b82f6;
          border-radius: 4px;
        }
        .calculate-btn {
          display: block;
          margin: 32px auto;
          padding: 16px 48px;
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        }
        .calculate-btn:hover { 
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
        }
        .calculate-btn:active {
          transform: translateY(0);
        }
        .calculate-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .result-card {
          background: linear-gradient(135deg, #f0f9ff, #dbeafe);
          border-left: 6px solid #2563eb;
          border-radius: 12px;
          padding: 32px;
          margin-top: 24px;
        }
        .probability-display {
          font-size: 4.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #b91c1c, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin: 20px 0;
          text-shadow: 0 2px 10px rgba(220, 38, 38, 0.2);
        }
        .contributors h3 { 
          margin-top: 0; 
          color: #1e40af;
          font-size: 1.3rem;
          margin-bottom: 16px;
        }
        .contributor-item {
          background: white;
          padding: 16px 20px;
          margin: 12px 0;
          border-radius: 10px;
          border-left: 5px solid #3b82f6;
          line-height: 1.5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        .contributor-item:hover {
          transform: translateX(5px);
        }
        .flags {
          margin-top: 32px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }
        .flag {
          background: #10b981;
          color: white;
          padding: 10px 20px;
          border-radius: 999px;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .flag.warning { 
          background: #f59e0b;
          color: #fff;
        }
        footer {
          text-align: center;
          color: #6b7280;
          margin-top: 40px;
          font-size: 0.9rem;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .loading-container {
          text-align: center;
          padding: 32px;
          color: #2563eb;
          font-weight: 600;
          font-size: 1.1rem;
        }
        .error-container {
          text-align: center;
          padding: 24px;
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 12px;
          margin: 24px 0;
          border: 2px solid #fecaca;
        }
        @media (max-width: 600px) { 
          .sliders-grid { grid-template-columns: 1fr; }
          .probability-display { font-size: 3.5rem; }
        }
      `}</style>

      <div className="vital-simulator">
        <h1>🩺 Pediatric Pneumonia Risk Analyzer</h1>

        <div className="card">
          <h2 style={{ color: '#1e40af', marginBottom: '24px' }}>Patient Vitals</h2>

          <div className="age-select-wrapper">
            <label htmlFor="ageGroup">
              <Users size={20} />
              Patient Age Group
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as typeof ageGroup)}
            >
              <option value="infant">👶 Infant (0–1 year)</option>
              <option value="toddler">🧒 Toddler (1–3 years)</option>
              <option value="preschool">👧 Preschool (4–6 years)</option>
              <option value="child">👦 Child (7–12 years)</option>
            </select>
          </div>

          <div className="sliders-grid">
            {/* Temperature */}
            <div className="slider-group">
              <label>
                🌡️ Temperature (°C)
                <span className="value-display">{vitals.Temperature_C.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={35.0}
                max={41.0}
                step={0.1}
                value={vitals.Temperature_C}
                onChange={(e) => setVitals(p => ({ ...p, Temperature_C: +e.target.value }))}
              />
            </div>

            <div className="slider-group">
              <label>
                📈 Temperature Trend (°C/min)
                <span className="value-display">
                  {vitals.Temperature_trend >= 0 ? "+" : ""}{vitals.Temperature_trend.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min={-1.5}
                max={2.0}
                step={0.1}
                value={vitals.Temperature_trend}
                onChange={(e) => setVitals(p => ({ ...p, Temperature_trend: +e.target.value }))}
              />
            </div>

            {/* SpO2 */}
            <div className="slider-group">
              <label>
                💉 SpO₂ (%)
                <span className="value-display">{vitals.SpO2_percent}</span>
              </label>
              <input
                type="range"
                min={80}
                max={100}
                step={1}
                value={vitals.SpO2_percent}
                onChange={(e) => setVitals(p => ({ ...p, SpO2_percent: +e.target.value }))}
              />
            </div>

            <div className="slider-group">
              <label>
                📉 SpO₂ Trend (%/min)
                <span className="value-display">
                  {vitals.SpO2_trend >= 0 ? "+" : ""}{vitals.SpO2_trend.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min={-8}
                max={3}
                step={0.5}
                value={vitals.SpO2_trend}
                onChange={(e) => setVitals(p => ({ ...p, SpO2_trend: +e.target.value }))}
              />
            </div>

            {/* Heart Rate */}
            <div className="slider-group">
              <label>
                ❤️ Heart Rate (bpm)
                <span className="value-display">{vitals.HeartRate_bpm}</span>
              </label>
              <input
                type="range"
                min={60}
                max={180}
                step={1}
                value={vitals.HeartRate_bpm}
                onChange={(e) => setVitals(p => ({ ...p, HeartRate_bpm: +e.target.value }))}
              />
            </div>

            <div className="slider-group">
              <label>
                ⚡ Heart Rate Trend (bpm/min)
                <span className="value-display">
                  {vitals.HeartRate_trend >= 0 ? "+" : ""}{vitals.HeartRate_trend}
                </span>
              </label>
              <input
                type="range"
                min={-15}
                max={25}
                step={1}
                value={vitals.HeartRate_trend}
                onChange={(e) => setVitals(p => ({ ...p, HeartRate_trend: +e.target.value }))}
              />
            </div>

            {/* Resp Rate */}
            <div className="slider-group">
              <label>
                🫁 Resp Rate (breaths/min)
                <span className="value-display">{vitals.RespRate_bpm}</span>
              </label>
              <input
                type="range"
                min={12}
                max={60}
                step={1}
                value={vitals.RespRate_bpm}
                onChange={(e) => setVitals(p => ({ ...p, RespRate_bpm: +e.target.value }))}
              />
            </div>

            <div className="slider-group">
              <label>
                📊 Resp Rate Trend
                <span className="value-display">
                  {vitals.RespRate_trend >= 0 ? "+" : ""}{vitals.RespRate_trend}
                </span>
              </label>
              <input
                type="range"
                min={-10}
                max={20}
                step={1}
                value={vitals.RespRate_trend}
                onChange={(e) => setVitals(p => ({ ...p, RespRate_trend: +e.target.value }))}
              />
            </div>

            {/* Yes/No Dropdowns */}
            <div className="slider-group">
              <label>🤧 Cough</label>
              <select
                className="yes-no-select"
                value={vitals.Cough}
                onChange={(e) => setVitals(p => ({ ...p, Cough: +e.target.value }))}
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>

            <div className="slider-group">
              <label>⚠️ Retractions</label>
              <select
                className="yes-no-select"
                value={vitals.Retractions}
                onChange={(e) => setVitals(p => ({ ...p, Retractions: +e.target.value }))}
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
          </div>

          <button 
            className="calculate-btn" 
            onClick={handleCalculate}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Analyzing...' : '🧠 Calculate Pneumonia Risk'}
          </button>
        </div>

        {isLoading && (
          <div className="loading-container">
            <Loader2 size={48} className="animate-spin mb-4" />
            Analyzing vitals with SHAP model...
          </div>
        )}

        {error && (
          <div className="error-container">
            <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
            {error}
          </div>
        )}

        {showResults && predictionResult && (
          <div className="card result-card">
            <h2 style={{ color: '#1e40af', textAlign: 'center', marginBottom: '16px' }}>
              Estimated Pneumonia Probability
            </h2>
            <div className="probability-display">
              {(predictionResult.vitals_probability * 100).toFixed(1)}%
            </div>

            <div className="contributors">
              <h3>🔍 Top Contributing Factors</h3>
              {predictionResult.risk_factors_text && predictionResult.risk_factors_text.length > 0 ? (
                predictionResult.risk_factors_text.map((text: string, i: number) => (
                  <div key={i} className="contributor-item">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: '#3b82f6' 
                      }} />
                      {text}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#4b5563', fontStyle: 'italic' }}>
                  No strong contributing factors identified.
                </p>
              )}
            </div>

            <div className="flags">
              <span className={`flag ${predictionResult.age_adjusted_flags.HeartRate.includes("High") ? "warning" : ""}`}>
                ❤️ Heart Rate: {predictionResult.age_adjusted_flags.HeartRate}
              </span>
              <span className={`flag ${predictionResult.age_adjusted_flags.RespRate.includes("High") ? "warning" : ""}`}>
                🫁 Respiratory Rate: {predictionResult.age_adjusted_flags.RespRate}
              </span>
              {predictionResult.vitals_probability >= 0.7 && (
                <span className="flag warning">
                  ⚠️ High Risk
                </span>
              )}
              {predictionResult.vitals_probability < 0.3 && (
                <span className="flag">
                  ✅ Low Risk
                </span>
              )}
            </div>
          </div>
        )}

        <footer>
          🧠 Powered by SHAP Explainable AI • 🏥 For educational purposes only • 
          Not for clinical use • Results are model-based predictions
        </footer>
      </div>
    </>
  );
};

export default VitalSignsSimulator;