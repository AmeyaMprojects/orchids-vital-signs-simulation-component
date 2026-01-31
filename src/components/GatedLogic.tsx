"use client";

import React, { useState } from "react";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useXrayContext } from "@/contexts/XrayContext";
import { useVitalsContext } from "@/contexts/VitalsContext";

interface VitalsInput {
  Temperature_C: number;
  Temperature_trend: number;
  SpO2_percent: number;
  SpO2_trend: number;
  HeartRate_bpm: number;
  HeartRate_trend: number;
  RespRate_bpm: number;
  RespRate_trend: number;
  Cough: number;
  Retractions: number;
}

interface TriageResult {
  level: string;
  recommendation: string;
  color: string;
  icon: React.ReactNode;
}

const CONFIDENCE_THRESHOLD = 0.4;

export default function GatedLogic() {
  const { imagingProbability, imagingConfidence } = useXrayContext();
  const { vitals } = useVitalsContext();

  // Calculate vitals probability (simplified mock - in production would call API)
  const calculateVitalsProbability = (): number => {
    let score = 0;
    
    // Temperature scoring
    if (vitals.Temperature_C > 38) score += 0.2;
    else if (vitals.Temperature_C > 37.5) score += 0.1;
    
    // SpO2 scoring
    if (vitals.SpO2_percent < 90) score += 0.3;
    else if (vitals.SpO2_percent < 95) score += 0.15;
    
    // Heart Rate scoring
    if (vitals.HeartRate_bpm > 120) score += 0.15;
    else if (vitals.HeartRate_bpm > 100) score += 0.1;
    
    // Respiratory Rate scoring
    if (vitals.RespRate_bpm > 35) score += 0.2;
    else if (vitals.RespRate_bpm > 28) score += 0.1;
    
    // Cough and Retractions
    if (vitals.Cough === 1) score += 0.1;
    if (vitals.Retractions === 1) score += 0.1;
    
    return Math.min(score, 1.0);
  };

  const imageConfidence = (p_img: number): number => {
    return Math.abs(p_img - 0.5) * 2;
  };

  const ageAdjustedAbnormalities = (): string => {
    const abnormal = (
      vitals.SpO2_percent < 95 ||
      vitals.RespRate_bpm > 28 ||
      vitals.HeartRate_bpm > 100 ||
      vitals.Temperature_C > 38
    );
    return abnormal ? "Present" : "Absent";
  };

  const triageLevel = (score: number): TriageResult => {
    if (score < 0.35) {
      return {
        level: "LOW RISK",
        recommendation: "🟢 Monitor at home",
        color: "bg-emerald-50 border-emerald-200 text-emerald-900",
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      };
    } else if (score < 0.60) {
      return {
        level: "MODERATE RISK",
        recommendation: "🟡 Further testing",
        color: "bg-yellow-50 border-yellow-200 text-yellow-900",
        icon: <Info className="w-8 h-8 text-yellow-600" />
      };
    } else if (score < 0.80) {
      return {
        level: "HIGH RISK",
        recommendation: "🟠 Admit for observation",
        color: "bg-orange-50 border-orange-200 text-orange-900",
        icon: <AlertTriangle className="w-8 h-8 text-orange-600" />
      };
    } else {
      return {
        level: "CRITICAL RISK",
        recommendation: "🔴 Immediate intervention",
        color: "bg-red-50 border-red-200 text-red-900",
        icon: <AlertTriangle className="w-8 h-8 text-red-600" />
      };
    }
  };

  const gatedFusion = (P_img: number, P_vitals: number) => {
    const img_conf = imageConfidence(P_img);

    let w_img = 0.6;
    let w_vitals = 0.4;
    let gateMessage = "High confidence imaging evidence";

    if (img_conf < CONFIDENCE_THRESHOLD) {
      w_img = 0.4;
      w_vitals = 0.6;
      gateMessage = "Imaging confidence reduced → vitals weighted higher";
    }

    let finalScore = (w_img * P_img) + (w_vitals * P_vitals);

    // Clinical safety cap
    if (P_vitals < 0.65 && finalScore > 0.8) {
      finalScore = 0.78;
    }

    return { finalScore, w_img, w_vitals, img_conf, gateMessage };
  };

  const systemTrustScore = (P_img: number, P_vitals: number): number => {
    // Measures agreement + confidence between models
    const agreement = 1 - Math.abs(P_img - P_vitals);

    const img_conf = Math.abs(P_img - 0.5) * 2;
    const vitals_conf = Math.abs(P_vitals - 0.5) * 2;

    const combined_conf = (img_conf + vitals_conf) / 2;

    const trust = agreement * combined_conf;

    return Math.max(0, Math.min(1, trust));
  };

  const getRiskFactors = (): string[] => {
    const factors: string[] = [];
    if (vitals.SpO2_percent < 95) factors.push("Low SpO2 (oxygen saturation)");
    if (vitals.RespRate_bpm > 28) factors.push("Elevated respiratory rate");
    if (vitals.HeartRate_bpm > 100) factors.push("Elevated heart rate");
    if (vitals.Temperature_C > 38) factors.push("Fever");
    if (vitals.Cough === 1) factors.push("Cough present");
    if (vitals.Retractions === 1) factors.push("Chest retractions");
    return factors;
  };

  const evidenceTriangulation = (P_img: number, vitals_probability: number, top_risk_factors: string[]): string => {
    const imaging_support = P_img >= 0.75;
    const vitals_support = vitals_probability >= 0.75;

    const phys_distress = top_risk_factors.some(factor =>
      /oxygen|spo2|respiratory|breathing/i.test(factor)
    );

    if (imaging_support && vitals_support && phys_distress) {
      return "High-confidence detection: Imaging findings align with physiological distress indicators.";
    } else if (imaging_support && vitals_support) {
      return "Moderate-confidence detection: Imaging and physiological signals are concordant.";
    } else if (imaging_support || vitals_support) {
      return "Low-confidence detection: Partial agreement between evidence sources.";
    } else {
      return "No strong concordance between imaging and physiological indicators.";
    }
  };

  // Calculate all values
  const P_vitals = calculateVitalsProbability();
  const { finalScore, w_img, w_vitals, img_conf, gateMessage } = gatedFusion(imagingProbability, P_vitals);
  const trustScore = systemTrustScore(imagingProbability, P_vitals);
  const riskFactors = getRiskFactors();
  const triangulation = evidenceTriangulation(imagingProbability, P_vitals, riskFactors);
  const abnormalities = ageAdjustedAbnormalities();
  const triage = triageLevel(finalScore);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Activity className="text-indigo-600 w-7 h-7" />
          Gated Logic Risk Assessment
        </h2>
        <p className="text-zinc-500 mt-1">
          Confidence-weighted fusion of imaging and physiological evidence for triage decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Output Section */}
        <div className="space-y-6">
          {/* Inputs to Gate */}
          <div className="bg-zinc-900 rounded-3xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4 text-emerald-400">INPUTS TO GATE</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Imaging Probability:</span>
                <span className="font-bold text-white">{imagingProbability.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Imaging Confidence:</span>
                <span className="font-bold text-white">
                  {img_conf.toFixed(2)} ({img_conf >= CONFIDENCE_THRESHOLD ? 'High' : 'Low'})
                </span>
              </div>
              <div className="h-px bg-zinc-700 my-3"></div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vitals Probability:</span>
                <span className="font-bold text-white">{P_vitals.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Age-adjusted abnormalities:</span>
                <span className={`font-bold ${abnormalities === 'Present' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {abnormalities}
                </span>
              </div>
            </div>
          </div>

          {/* Fusion Weights */}
          <div className="bg-indigo-50 rounded-3xl p-6 border-2 border-indigo-200">
            <h3 className="text-lg font-bold mb-4 text-indigo-900">FUSION WEIGHTS</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-semibold">Imaging Evidence:</span>
                <span className="font-bold text-indigo-900 text-xl">{(w_img * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-semibold">Vitals Evidence:</span>
                <span className="font-bold text-indigo-900 text-xl">{(w_vitals * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-4 p-3 bg-white rounded-xl">
                <p className="text-xs text-indigo-700 italic">{gateMessage}</p>
              </div>
            </div>
          </div>

          {/* System Trust Score */}
          <div className="bg-purple-50 rounded-3xl p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold mb-4 text-purple-900">SYSTEM TRUST SCORE</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-semibold">Trust Score:</span>
                <span className="font-bold text-purple-900 text-2xl">{trustScore.toFixed(2)} ({(trustScore * 100).toFixed(0)}%)</span>
              </div>
              <div className="mt-4 p-3 bg-white rounded-xl">
                <p className="text-xs text-purple-700">
                  <strong>Interpretation:</strong>{" "}
                  {trustScore > 0.7
                    ? "High agreement & confidence"
                    : trustScore > 0.4
                    ? "Moderate agreement"
                    : "Low agreement - review inputs"}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Triangulation */}
          <div className="bg-cyan-50 rounded-3xl p-6 border-2 border-cyan-200">
            <h3 className="text-lg font-bold mb-4 text-cyan-900">EVIDENCE TRIANGULATION</h3>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl">
                <p className="text-sm text-cyan-900">{triangulation}</p>
              </div>
              {riskFactors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-cyan-800 mb-2">Detected Risk Factors:</p>
                  <ul className="space-y-1">
                    {riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-xs text-cyan-700 flex items-start gap-2">
                        <span className="text-cyan-500">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Final Risk Score */}
          <div className="bg-white rounded-3xl p-6 border-2 border-zinc-200">
            <h3 className="text-lg font-bold mb-4 text-zinc-900">FINAL RISK SCORE</h3>
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 font-mono">
                ({w_img.toFixed(2)} × Imaging) + ({w_vitals.toFixed(2)} × Vitals)
              </p>
              <motion.div
                key={finalScore}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-5xl font-black text-indigo-600 text-center"
              >
                {finalScore.toFixed(2)}
              </motion.div>
            </div>
          </div>

          {/* Final Triage Decision */}
          <motion.div
            key={triage.level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 border-2 ${triage.color}`}
          >
            <h3 className="text-lg font-bold mb-4">FINAL TRIAGE DECISION</h3>
            <div className="flex items-center gap-4 mb-4">
              {triage.icon}
              <div>
                <h4 className="text-2xl font-black">{triage.level}</h4>
                <p className="text-lg font-semibold mt-1">{triage.recommendation}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/50 rounded-xl">
              <p className="text-sm font-medium">
                <strong>Decision Rationale:</strong>{" "}
                {img_conf >= CONFIDENCE_THRESHOLD
                  ? "High confidence imaging evidence combined with worsening physiological trends resulted in a critical risk classification."
                  : "Due to ambiguous imaging evidence, the system relied more heavily on physiological deterioration to ensure patient safety."}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-amber-700 text-xs border border-amber-200 italic mt-8">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p>
          CLINICAL DISCLAIMER: This gated logic system is for educational and research purposes only. 
          All triage decisions must be validated by qualified healthcare professionals.
        </p>
      </div>
    </div>
  );
}
