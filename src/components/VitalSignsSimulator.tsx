"use client";

import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
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

interface SimulationResult {
  status: "Normal" | "Pneumonia" | "Borderline";
  message: string;
  color: string;
  icon: React.ReactNode;
}

export default function VitalSignsSimulator() {
  const [vitals, setVitals] = useState<Vitals>({
    temp: 37,
    spo2: 98,
    hr: 100,
    rr: 25,
    cough: 0.05,
    retractions: 0.02,
  });
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [lastLog, setLastLog] = useState<Vitals | null>(null);
  
    const handleSimulate = () => {
      console.log("Simulation Values:", JSON.stringify(vitals, null, 2));
      setLastLog(vitals);
      let pneumoniaCount = 0;
    let normalCount = 0;

    const vitalsList: (keyof Vitals)[] = ["temp", "spo2", "hr", "rr", "cough", "retractions"];
    
    vitalsList.forEach(key => {
      const p = SCENARIO_LIMITS.PNEUMONIA[key];
      const n = SCENARIO_LIMITS.NORMAL[key];
      
      if (vitals[key] >= p.min && vitals[key] <= p.max) pneumoniaCount++;
      if (vitals[key] >= n.min && vitals[key] <= n.max) normalCount++;
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

  const renderSlider = (label: string, key: keyof Vitals, icon: React.ReactNode) => {
    const config = GLOBAL_RANGES[key];
    const value = vitals[key];

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            {icon}
            <span>{label}</span>
          </div>
          <div className="text-zinc-900 font-bold tabular-nums">
            {key === 'cough' || key === 'retractions' 
              ? `${(value * 100).toFixed(0)}%` 
              : `${value.toFixed(1)}${config.unit}`}
          </div>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[value]}
          max={config.max}
          min={config.min}
          step={config.step}
          onValueChange={([val]) => {
            setVitals(prev => ({ ...prev, [key]: val }));
            if (result) setResult(null);
          }}
        >
          <Slider.Track className="bg-zinc-200 relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white shadow-lg border-2 border-indigo-500 rounded-full hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform active:scale-110"
            aria-label={label}
          />
        </Slider.Root>
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
          <span>Min: {config.min}{config.unit !== 'prob' ? config.unit : ''}</span>
          <span>Max: {config.max}{config.unit !== 'prob' ? config.unit : ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-zinc-100 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="text-indigo-600 w-7 h-7" />
            Clinical Vital Signs Simulator
          </h2>
          <p className="text-zinc-500 mt-1">Adjust sliders to see how vital sign combinations relate to clinical patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-8">
          {renderSlider("Temperature", "temp", <Thermometer className="w-5 h-5 text-orange-500" />)}
          {renderSlider("SpO₂ (Oxygen)", "spo2", <Droplets className="w-5 h-5 text-blue-500" />)}
          {renderSlider("Heart Rate", "hr", <Activity className="w-5 h-5 text-rose-500" />)}
        </div>
        <div className="space-y-8">
          {renderSlider("Respiratory Rate", "rr", <Wind className="w-5 h-5 text-cyan-500" />)}
          {renderSlider("Cough Probability", "cough", <Info className="w-5 h-5 text-purple-500" />)}
          {renderSlider("Chest Retractions", "retractions", <AlertCircle className="w-5 h-5 text-amber-500" />)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <button
          onClick={handleSimulate}
          className="group relative px-10 py-5 bg-zinc-900 text-white rounded-2xl font-bold text-lg transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 shadow-xl shadow-zinc-200"
        >
          Simulate Condition
          <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

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
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>
            DISCLAIMER: This simulation is for educational purposes only. Diagnosis must be made by a qualified healthcare professional.
          </p>
          </div>
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
                  <span className="text-zinc-400 text-xs font-mono uppercase tracking-widest">Simulation Values (JSON)</span>
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
    );
  }

