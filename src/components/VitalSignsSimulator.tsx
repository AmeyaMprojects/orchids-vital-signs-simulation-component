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
      <motion.div 
        className="space-y-3 bg-zinc-50 rounded-2xl p-6 border border-zinc-200"
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            {icon}
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-3">
            {getTrendIcon()}
            <motion.div 
              className="text-zinc-900 font-bold tabular-nums text-2xl"
              key={value}
              initial={{ scale: 1.2, color: "#4f46e5" }}
              animate={{ scale: 1, color: "#18181b" }}
              transition={{ duration: 0.5 }}
            >
              {key === 'cough' || key === 'retractions' 
                ? `${(value * 100).toFixed(0)}%` 
                : `${value.toFixed(1)}${config.unit}`}
            </motion.div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Normal: {key === 'cough' || key === 'retractions' 
            ? `${(SCENARIO_LIMITS.NORMAL[key].min * 100).toFixed(0)}-${(SCENARIO_LIMITS.NORMAL[key].max * 100).toFixed(0)}%`
            : `${SCENARIO_LIMITS.NORMAL[key].min}-${SCENARIO_LIMITS.NORMAL[key].max}${config.unit}`}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-zinc-100 overflow-hidden">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="text-indigo-600 w-7 h-7" />
          Live Vital Signs Monitor
        </h2>
        <p className="text-zinc-500 mt-1">Real-time streaming vital signs data with trend indicators.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10">
        {renderVitalCard("Temperature", "temp", <Thermometer className="w-5 h-5 text-orange-500" />)}
        {renderVitalCard("SpO₂ (Oxygen)", "spo2", <Droplets className="w-5 h-5 text-blue-500" />)}
        {renderVitalCard("Heart Rate", "hr", <Activity className="w-5 h-5 text-rose-500" />)}
        {renderVitalCard("Respiratory Rate", "rr", <Wind className="w-5 h-5 text-cyan-500" />)}
        {renderVitalCard("Cough Probability", "cough", <Info className="w-5 h-5 text-purple-500" />)}
        {renderVitalCard("Chest Retractions", "retractions", <AlertCircle className="w-5 h-5 text-amber-500" />)}
      </div>

      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={cn(
                "w-full p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-6",
                result.color
              )}
            >
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                {result.icon}
              </div>
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-xl font-extrabold uppercase tracking-tight">{result.status} PATTERN</h3>
                <p className="text-lg leading-relaxed font-medium opacity-90">{result.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl text-zinc-500 text-xs border border-zinc-100 italic">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>
            DISCLAIMER: This simulation is for educational purposes only. Diagnosis must be made by a qualified healthcare professional.
          </p>
        </div>

        <AnimatePresence>
          {lastLog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="w-full mt-4"
            >
              <div className="bg-zinc-900 rounded-2xl p-6 overflow-hidden shadow-inner border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 text-xs font-mono uppercase tracking-widest">Live Streaming Data (JSON)</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  </div>
                </div>
                <pre className="text-emerald-400 font-mono text-sm overflow-x-auto selection:bg-emerald-500/20">
                  {JSON.stringify(lastLog, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

