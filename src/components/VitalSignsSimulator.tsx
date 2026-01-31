"use client";

import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useVitalsContext } from '@/contexts/VitalsContext';

const VitalSignsSimulator: React.FC = () => {
  const { setVitals: updateGlobalVitals } = useVitalsContext();
  const [ageGroup, setAgeGroup] = useState<"infant" | "toddler" | "preschool" | "child">("preschool");

  const [vitals, setVitals] = useState({
    Temperature_C: 38.2,
    Temperature_trend: 0.7,
    SpO2_percent: 92,
    SpO2_trend: -2.5,
    HeartRate_bpm: 130,
    HeartRate_trend: 10,
    RespRate_bpm: 38,
    RespRate_trend: 8,
    Cough: 1,        // 1 = Yes, 0 = No
    Retractions: 1,  // 1 = Yes, 0 = No
  });

  // Update global context whenever vitals change
  useEffect(() => {
    updateGlobalVitals(vitals);
  }, [vitals, updateGlobalVitals]);

  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  // PEDIATRIC NORMAL RANGES
  const PEDIATRIC_NORMALS = {
    infant: { HeartRate_bpm: [100, 160], RespRate_bpm: [30, 60] },
    toddler: { HeartRate_bpm: [90, 150], RespRate_bpm: [24, 40] },
    preschool: { HeartRate_bpm: [80, 120], RespRate_bpm: [22, 34] },
    child: { HeartRate_bpm: [70, 110], RespRate_bpm: [18, 30] },
  };

  const ageFlags = {
    HeartRate:
      vitals.HeartRate_bpm > PEDIATRIC_NORMALS[ageGroup].HeartRate_bpm[1]
        ? "High for age"
        : "Normal for age",
    RespRate:
      vitals.RespRate_bpm > PEDIATRIC_NORMALS[ageGroup].RespRate_bpm[1]
        ? "High for age"
        : "Normal for age",
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitals: vitals,
          age_group: ageGroup
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Prediction failed');
      }

      const result = await response.json();
      setPredictionResult(result);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
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
        <h1>Pediatric Pneumonia Risk Analyzer</h1>

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
              <option value="infant">Infant (0–1 year)</option>
              <option value="toddler">Toddler (1–3 years)</option>
              <option value="preschool">Preschool (4–6 years)</option>
              <option value="child">Child (7–12 years)</option>
            </select>
          </div>

          <div className="sliders-grid">
            {/* Temperature */}
            <div className="slider-group">
              <label>
                Temperature (°C)
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
                Temperature Trend (°C/min)
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
                SpO₂ (%)
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
                SpO₂ Trend (%/min)
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
                Heart Rate (bpm)
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
                Heart Rate Trend (bpm/min)
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
                Resp Rate (breaths/min)
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
                Resp Rate Trend
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
              <label>Cough</label>
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
              <label>Retractions</label>
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
            {isLoading ? 'Analyzing...' : 'Calculate Pneumonia Risk'}
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
              <h3>Top Contributing Factors</h3>
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
                Heart Rate: {predictionResult.age_adjusted_flags.HeartRate}
              </span>
              <span className={`flag ${predictionResult.age_adjusted_flags.RespRate.includes("High") ? "warning" : ""}`}>
                Respiratory Rate: {predictionResult.age_adjusted_flags.RespRate}
              </span>
              {predictionResult.vitals_probability >= 0.7 && (
                <span className="flag warning">
                  High Risk
                </span>
              )}
              {predictionResult.vitals_probability < 0.3 && (
                <span className="flag">
                  Low Risk
                </span>
              )}
            </div>
          </div>
        )}

        <footer>
          Powered by SHAP Explainable AI • For educational purposes only • 
          Not for clinical use • Results are model-based predictions
        </footer>
      </div>
    </>
  );
};

export default VitalSignsSimulator;