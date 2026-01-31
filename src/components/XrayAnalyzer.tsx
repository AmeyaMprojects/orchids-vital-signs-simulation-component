"use client";

import React, { useState, useRef } from "react";
import { Upload, Scan, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisResult {
  label: string;
  probability: number;
  image: string;
}

export default function XrayAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [disagreeRisk, setDisagreeRisk] = useState(false);
  const [disagreeImage, setDisagreeImage] = useState(false);
  const [disagreeVitals, setDisagreeVitals] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      console.log('[Client] No file selected');
      return;
    }

    console.log('[Client] Starting analysis for file:', selectedFile.name);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    console.log('[Client] FormData created with file');

    try {
      console.log('[Client] Sending request to /api/analyze-xray...');
      const response = await fetch('/api/analyze-xray', {
        method: 'POST',
        body: formData,
      });

      console.log('[Client] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Client] Error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('[Client] X-ray Analysis Result:', JSON.stringify(data, null, 2));
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze X-ray. Please try again.';
      setError(errorMessage);
      console.error('[Client] Analysis error:', err);
    } finally {
      setLoading(false);
      console.log('[Client] Analysis complete');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setShowFeedback(false);
    setDisagreeRisk(false);
    setDisagreeImage(false);
    setDisagreeVitals(false);
    setFeedbackNotes("");
    setFeedbackSubmitted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitFeedback = () => {
    const feedback = {
      timestamp: new Date().toISOString(),
      imagePath: selectedFile?.name || "",
      imageProbability: result?.probability || 0,
      vitalsInterpretation: "N/A", // Can be connected to vitals data if needed
      triage_level: result?.label || "",
      imageConfidence: result?.probability || 0,
      disagreeRisk,
      disagreeImage,
      disagreeVitals,
      notes: feedbackNotes,
    };

    console.log("Clinician Feedback:", JSON.stringify(feedback, null, 2));
    
    // Here you could send feedback to an API endpoint
    // await fetch('/api/submit-feedback', { method: 'POST', body: JSON.stringify(feedback) });
    
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackSubmitted(false);
      setDisagreeRisk(false);
      setDisagreeImage(false);
      setDisagreeVitals(false);
      setFeedbackNotes("");
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Scan className="text-indigo-600 w-7 h-7" />
          X-Ray Pneumonia Analyzer
        </h2>
        <p className="text-zinc-500 mt-1">Upload a chest X-ray image to analyze for pneumonia patterns using AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-dashed border-zinc-200 p-8 text-center hover:border-indigo-300 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="xray-upload"
            />
            <label
              htmlFor="xray-upload"
              className="cursor-pointer block"
            >
              <Upload className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {selectedFile ? selectedFile.name : 'Choose X-ray Image'}
              </h3>
              <p className="text-sm text-zinc-500">
                Click to select or drag and drop
              </p>
            </label>
          </div>

          {previewUrl && (
            <div className="relative bg-zinc-900 rounded-3xl overflow-hidden">
              <img
                src={previewUrl}
                alt="X-ray preview"
                className="w-full h-auto"
              />
              <button
                onClick={handleClear}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-700" />
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg transition-all hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  Analyze X-ray
                </>
              )}
            </button>
            {selectedFile && (
              <button
                onClick={handleClear}
                className="px-8 py-4 bg-zinc-100 text-zinc-700 rounded-2xl font-bold text-lg transition-all hover:bg-zinc-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 flex items-start gap-4"
              >
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-900 mb-1">Analysis Failed</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-3xl p-6 border-2 ${
                  result.label === 'PNEUMONIA'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {result.label === 'PNEUMONIA' ? (
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  )}
                  <div>
                    <h3 className={`text-2xl font-extrabold ${
                      result.label === 'PNEUMONIA' ? 'text-red-900' : 'text-emerald-900'
                    }`}>
                      {result.label}
                    </h3>
                    <p className={`text-lg font-semibold ${
                      result.label === 'PNEUMONIA' ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      Confidence: {(result.probability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-2xl overflow-hidden">
                  <img
                    src={`data:image/png;base64,${result.image}`}
                    alt="Analysis result"
                    className="w-full h-auto"
                  />
                </div>

                <p className={`mt-4 text-sm font-medium ${
                  result.label === 'PNEUMONIA' ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {result.label === 'PNEUMONIA'
                    ? 'The AI model has detected patterns consistent with pneumonia. The heatmap shows areas of concern in red/orange.'
                    : 'The AI model indicates normal chest X-ray patterns. The heatmap shows minimal areas of concern in green/yellow.'}
                </p>

                {/* Feedback Section */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowFeedback(!showFeedback)}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold transition-all hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {showFeedback ? 'Hide Feedback' : 'Provide Clinical Feedback'}
                  </button>

                  <AnimatePresence>
                    {showFeedback && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100">
                          <h4 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            🩺 Clinician Feedback (Optional)
                          </h4>

                          <div className="space-y-3 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={disagreeRisk}
                                onChange={(e) => setDisagreeRisk(e.target.checked)}
                                className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-zinc-700 group-hover:text-zinc-900 font-medium">
                                I disagree with the assigned risk level
                              </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={disagreeImage}
                                onChange={(e) => setDisagreeImage(e.target.checked)}
                                className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-zinc-700 group-hover:text-zinc-900 font-medium">
                                X-ray explanation may be misleading (artifact / quality issue)
                              </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={disagreeVitals}
                                onChange={(e) => setDisagreeVitals(e.target.checked)}
                                className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-zinc-700 group-hover:text-zinc-900 font-medium">
                                Vitals interpretation seems incorrect
                              </span>
                            </label>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-zinc-700 mb-2">
                              Additional notes (optional)
                            </label>
                            <textarea
                              value={feedbackNotes}
                              onChange={(e) => setFeedbackNotes(e.target.value)}
                              className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans"
                              rows={3}
                              placeholder="Enter any additional feedback or observations..."
                            />
                          </div>

                          <button
                            onClick={handleSubmitFeedback}
                            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold transition-all hover:bg-emerald-700 flex items-center justify-center gap-2"
                          >
                            {feedbackSubmitted ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                Feedback Recorded!
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                Submit Feedback
                              </>
                            )}
                          </button>

                          {feedbackSubmitted && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-3 text-sm text-emerald-600 text-center font-medium"
                            >
                              ✓ Feedback recorded. Thank you for helping improve the system.
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {!result && !error && !loading && (
              <div className="bg-zinc-50 rounded-3xl p-12 text-center border border-zinc-200">
                <Scan className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-zinc-500">
                  Upload an X-ray image and click "Analyze X-ray" to see results.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl text-amber-700 text-xs border border-amber-200 italic mt-8">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <p>
          MEDICAL DISCLAIMER: This AI analysis is for educational purposes only and should NOT be used for clinical diagnosis. 
          Always consult qualified healthcare professionals for medical evaluation and treatment decisions.
        </p>
      </div>
    </div>
  );
}
