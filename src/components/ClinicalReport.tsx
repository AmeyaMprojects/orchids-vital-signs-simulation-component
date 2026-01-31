"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVitalsContext } from "@/contexts/VitalsContext";
import { useXrayContext } from "@/contexts/XrayContext";

interface ReportData {
  triage_level: string;
  next_steps: string[];
  next_steps_summary: string;
  clinical_report: string;
}

export default function ClinicalReport() {
  const { vitals } = useVitalsContext();
  const { xrayResult } = useXrayContext();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

  const generateReport = async () => {
    console.log('[ClinicalReport] Starting report generation');
    console.log('[ClinicalReport] Current vitals:', vitals);
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // First, get vitals analysis
      console.log('[ClinicalReport] Fetching vitals analysis...');
      const vitalsResponse = await fetch('/api/analyze-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vitals: {
            temp: vitals.Temperature_C,
            tempTrend: vitals.Temperature_trend,
            spo2: vitals.SpO2_percent,
            spo2Trend: vitals.SpO2_trend,
            hr: vitals.HeartRate_bpm,
            hrTrend: vitals.HeartRate_trend,
            rr: vitals.RespRate_bpm,
            rrTrend: vitals.RespRate_trend,
            cough: vitals.Cough,
            retractions: vitals.Retractions,
          },
          ageGroup: 'preschool',
        }),
      });

      if (!vitalsResponse.ok) {
        const errorText = await vitalsResponse.text();
        console.error('[ClinicalReport] Vitals analysis failed:', errorText);
        throw new Error('Failed to analyze vitals: ' + errorText);
      }

      const vitalsData = await vitalsResponse.json();
      console.log('[ClinicalReport] Vitals analysis result:', vitalsData);
      setRiskAnalysis(vitalsData);
      
      // Now generate the report
      console.log('[ClinicalReport] Generating clinical report...');
      const reportResponse = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vitals_probability: vitalsData.vitals_probability,
          age_group: 'Preschool',
          image_probability: xrayResult?.probability || 0,
          shap_contributors: vitalsData.top_contributors,
          age_adjusted_flags: vitalsData.age_adjusted_flags,
          risk_factors_text: vitalsData.risk_factors_text,
        }),
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        console.error('[ClinicalReport] Report generation failed:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const reportData = await reportResponse.json();
      console.log('[ClinicalReport] Report generated successfully:', reportData);
      setReport(reportData);
      
    } catch (error) {
      console.error('[ClinicalReport] Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'HIGH RISK':
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'MODERATE RISK':
        return 'bg-amber-50 border-amber-300 text-amber-900';
      case 'LOW RISK':
        return 'bg-emerald-50 border-emerald-300 text-emerald-900';
      default:
        return 'bg-zinc-50 border-zinc-300 text-zinc-900';
    }
  };

  const getTriageIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      case 'HIGH RISK':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'MODERATE RISK':
        return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'LOW RISK':
        return <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
      default:
        return <FileText className="w-8 h-8 text-zinc-600" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      <div className="text-center space-y-4">
        <FileText className="w-16 h-16 text-indigo-600 mx-auto" />
        <h2 className="text-3xl font-bold text-zinc-900">Clinical Decision Support Report</h2>
        <p className="text-zinc-600 max-w-2xl mx-auto">
          Generate a comprehensive clinical report based on vital signs analysis and imaging assessment.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className={cn(
            "px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg",
            isGenerating
              ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl active:scale-98"
          )}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Report...
            </span>
          ) : (
            "Generate Clinical Report"
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Triage Level */}
            <div className={cn("rounded-2xl p-6 border-2", getTriageColor(report.triage_level))}>
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  {getTriageIcon(report.triage_level)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Triage Level</h3>
                  <p className="text-2xl font-extrabold mt-1">{report.triage_level}</p>
                </div>
              </div>
            </div>

            {/* Clinical Report */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">Clinical Summary</h3>
              <p className="text-zinc-700 leading-relaxed whitespace-pre-line">
                {report.clinical_report}
              </p>
            </div>

            {/* Next Steps Summary */}
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Recommended Actions</h3>
              <p className="text-blue-800 leading-relaxed mb-4">
                {report.next_steps_summary}
              </p>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Specific Steps:</h4>
                <ul className="space-y-2">
                  {report.next_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-blue-900">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl text-zinc-500 text-xs border border-zinc-100 italic">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>
                DISCLAIMER: This report is for clinical decision support only. Final diagnosis and treatment decisions must be made by qualified healthcare professionals based on comprehensive clinical evaluation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
