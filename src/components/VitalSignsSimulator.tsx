"use client";

import React, { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVitalsContext } from "@/contexts/VitalsContext";
import WaterfallChart from "./WaterfallChart";

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
  temp: { min: 36, max: 40, step: 0.1, unit: "°C" },
  spo2: { min: 88, max: 100, step: 1, unit: "%" },
  hr: { min: 85, max: 135, step: 1, unit: "bpm" },
  rr: { min: 20, max: 44, step: 1, unit: "breaths/min" },
  cough: { min: 0, max: 1, step: 1, unit: "" },
  retractions: { min: 0, max: 1, step: 1, unit: "" },
};

const TREND_RANGES: Record<string, VitalRange> = {
  temp: { min: -1.0, max: 0.4, step: 0.1, unit: "°C" },
  spo2: { min: -4, max: 1.5, step: 0.5, unit: "%" },
  hr: { min: -15, max: 5, step: 1, unit: "bpm" },
  rr: { min: -12, max: 4, step: 1, unit: "breaths/min" },
};

const PEDIATRIC_NORMALS = {
  infant: {
    label: "Infant (0-1 year)",
    HeartRate_bpm: { min: 100, max: 160 },
    RespRate_bpm: { min: 30, max: 60 }
  },
  toddler: {
    label: "Toddler (1-3 years)",
    HeartRate_bpm: { min: 90, max: 150 },
    RespRate_bpm: { min: 24, max: 40 }
  },
  preschool: {
    label: "Preschool (4-6 years)",
    HeartRate_bpm: { min: 80, max: 120 },
    RespRate_bpm: { min: 22, max: 34 }
  },
  child: {
    label: "Child (7-12 years)",
    HeartRate_bpm: { min: 70, max: 110 },
    RespRate_bpm: { min: 18, max: 30 }
  }
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
  temp: number;
  spo2: number;
  hr: number;
  rr: number;
}

interface RiskAnalysis {
  vitals_probability: number;
  top_contributors: Array<{
    feature: string;
    contribution: number;
  }>;
  risk_factors_text: string[];
  age_adjusted_flags: {
    HeartRate: string;
    RespRate: string;
  };
}

export default function VitalSignsSimulator() {
  const { setVitals: setContextVitals, riskAnalysis, setRiskAnalysis, ageGroup, setAgeGroup } = useVitalsContext();
  
  const [vitals, setVitals] = useState<Vitals>({
    temp: 38,
    spo2: 94,
    hr: 110,
    rr: 32,
    cough: 0,
    retractions: 0,
  });
  const [trends, setTrends] = useState<VitalTrends>({
    temp: 0,
    spo2: 0,
    hr: 0,
    rr: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    // Update context with current vitals
    setContextVitals({
      Temperature_C: vitals.temp,
      Temperature_trend: trends.temp,
      SpO2_percent: vitals.spo2,
      SpO2_trend: trends.spo2,
      HeartRate_bpm: vitals.hr,
      HeartRate_trend: trends.hr,
      RespRate_bpm: vitals.rr,
      RespRate_trend: trends.rr,
      Cough: vitals.cough,
      Retractions: vitals.retractions,
    });
  }, [vitals, trends, setContextVitals]);
  
  const handleVitalChange = (key: keyof Vitals, value: number[]) => {
    setVitals(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  const handleTrendChange = (key: keyof VitalTrends, value: number[]) => {
    setTrends(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  const calculateRisk = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await fetch('/api/analyze-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vitals: {
            temp: vitals.temp,
            tempTrend: trends.temp,
            spo2: vitals.spo2,
            spo2Trend: trends.spo2,
            hr: vitals.hr,
            hrTrend: trends.hr,
            rr: vitals.rr,
            rrTrend: trends.rr,
            cough: vitals.cough,
            retractions: vitals.retractions,
          },
          ageGroup: ageGroup,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze vitals');
      }

      const data = await response.json();
      setRiskAnalysis(data);
    } catch (error) {
      console.error('Error calculating risk:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to calculate risk');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderVitalCard = (label: string, key: keyof Vitals, icon: React.ReactNode) => {
    const config = GLOBAL_RANGES[key];
    const value = vitals[key];
    const hasTrend = key === 'temp' || key === 'spo2' || key === 'hr' || key === 'rr';
    const trendValue = hasTrend ? trends[key as keyof VitalTrends] : 0;
    const trendConfig = hasTrend ? TREND_RANGES[key] : null;

    return (
      <motion.div 
        className="space-y-4 bg-zinc-50 rounded-2xl p-6 border border-zinc-200"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            {icon}
            <span>{label}</span>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-zinc-900 font-bold tabular-nums text-2xl"
              key={value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {key === 'cough' || key === 'retractions' 
                ? value === 1 ? 'Yes' : 'No'
                : key === 'temp'
                ? `${value.toFixed(1)}${config.unit}`
                : `${value}${config.unit}`}
            </motion.div>
            {hasTrend && (
              <div className={cn(
                "text-sm font-medium mt-1",
                trendValue > 0 ? "text-red-600" : trendValue < 0 ? "text-blue-600" : "text-zinc-400"
              )}>
                {trendValue > 0 ? '↑' : trendValue < 0 ? '↓' : '−'} {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}{config.unit}
              </div>
            )}
          </div>
        </div>
        
        {key === 'cough' || key === 'retractions' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleVitalChange(key, [0])}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
                value === 0 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              )}
            >
              No
            </button>
            <button
              onClick={() => handleVitalChange(key, [1])}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
                value === 1 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              )}
            >
              Yes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-xs text-zinc-600 font-medium">Current Value</div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={(e) => handleVitalChange(key, [parseFloat(e.target.value)])}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{config.min}{config.unit}</span>
                <span>Normal: {key === 'cough' || key === 'retractions' 
                  ? `${(SCENARIO_LIMITS.NORMAL[key].min * 100).toFixed(0)}-${(SCENARIO_LIMITS.NORMAL[key].max * 100).toFixed(0)}%`
                  : key === 'hr'
                  ? `${PEDIATRIC_NORMALS[ageGroup].HeartRate_bpm.min}-${PEDIATRIC_NORMALS[ageGroup].HeartRate_bpm.max}${config.unit}`
                  : key === 'rr'
                  ? `${PEDIATRIC_NORMALS[ageGroup].RespRate_bpm.min}-${PEDIATRIC_NORMALS[ageGroup].RespRate_bpm.max}${config.unit}`
                  : `${SCENARIO_LIMITS.NORMAL[key].min}-${SCENARIO_LIMITS.NORMAL[key].max}${config.unit}`}
                </span>
                <span>{config.max}{config.unit}</span>
              </div>
            </div>
            
            {hasTrend && trendConfig && (
              <div className="space-y-2 pt-2 border-t border-zinc-200">
                <div className="text-xs text-zinc-600 font-medium">Trend</div>
                <input
                  type="range"
                  min={trendConfig.min}
                  max={trendConfig.max}
                  step={trendConfig.step}
                  value={trendValue}
                  onChange={(e) => handleTrendChange(key as keyof VitalTrends, [parseFloat(e.target.value)])}
                  className="w-full h-2 bg-gradient-to-r from-blue-200 via-zinc-200 to-red-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{trendConfig.min}{trendConfig.unit}</span>
                  <span>0{trendConfig.unit}</span>
                  <span>+{trendConfig.max}{trendConfig.unit}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-zinc-100 overflow-hidden">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="text-indigo-600 w-7 h-7" />
          Vital Signs Simulator
        </h2>
        <p className="text-zinc-500 mt-1">Adjust vital signs to see different health patterns.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Patient Age Group
        </label>
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value as keyof typeof PEDIATRIC_NORMALS)}
          className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer"
        >
          {Object.entries(PEDIATRIC_NORMALS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10">
        {renderVitalCard("Temperature", "temp", <Thermometer className="w-5 h-5 text-orange-500" />)}
        {renderVitalCard("SpO₂ (Oxygen)", "spo2", <Droplets className="w-5 h-5 text-blue-500" />)}
        {renderVitalCard("Heart Rate", "hr", <Activity className="w-5 h-5 text-rose-500" />)}
        {renderVitalCard("Respiratory Rate", "rr", <Wind className="w-5 h-5 text-cyan-500" />)}
        {renderVitalCard("Cough Probability", "cough", <Info className="w-5 h-5 text-purple-500" />)}
        {renderVitalCard("Chest Retractions", "retractions", <AlertCircle className="w-5 h-5 text-amber-500" />)}
      </div>

      <div className="mb-8">
        <button
          onClick={calculateRisk}
          disabled={isAnalyzing}
          className={cn(
            "w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-lg",
            isAnalyzing
              ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl active:scale-98"
          )}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            "Calculate Pneumonia Risk"
          )}
        </button>
        {analysisError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <strong>Error:</strong> {analysisError}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {riskAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6"
            >
              {/* Risk Probability */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-indigo-900">Pneumonia Risk Probability</h3>
                  <div className="text-3xl font-extrabold text-indigo-600">
                    {(riskAnalysis.vitals_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${riskAnalysis.vitals_probability * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      riskAnalysis.vitals_probability > 0.7 ? "bg-red-500" :
                      riskAnalysis.vitals_probability > 0.4 ? "bg-amber-500" :
                      "bg-green-500"
                    )}
                  />
                </div>
              </div>

              {/* Age-Adjusted Flags */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Age-Adjusted Assessment</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">Heart Rate:</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg font-semibold text-sm",
                      riskAnalysis.age_adjusted_flags.HeartRate.includes("Normal")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {riskAnalysis.age_adjusted_flags.HeartRate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">Respiratory Rate:</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg font-semibold text-sm",
                      riskAnalysis.age_adjusted_flags.RespRate.includes("Normal")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}>
                      {riskAnalysis.age_adjusted_flags.RespRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
                <h3 className="text-lg font-bold text-amber-900 mb-4">Key Risk Factors</h3>
                <ul className="space-y-3">
                  {riskAnalysis.risk_factors_text.map((factor, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-amber-700 font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-amber-900 leading-relaxed">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Contributors */}
              <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Top Contributing Factors (SHAP)</h3>
                <div className="space-y-3">
                  {riskAnalysis.top_contributors.map((contributor, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-purple-800 font-medium text-sm">
                            {contributor.feature.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              contributor.contribution > 0 ? "bg-red-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(Math.abs(contributor.contribution) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waterfall Chart */}
              {riskAnalysis.waterfall && (
                <WaterfallChart data={riskAnalysis.waterfall} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl text-zinc-500 text-xs border border-zinc-100 italic">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>
            DISCLAIMER: This simulation is for educational purposes only. Diagnosis must be made by a qualified healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}

