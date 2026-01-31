"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface XrayResult {
  label: string;
  probability: number;
  image: string;
}

interface XrayContextType {
  imagingProbability: number;
  imagingConfidence: number;
  xrayResult: XrayResult | null;
  previewUrl: string | null;
  setXrayResults: (probability: number, confidence: number) => void;
  setXrayResult: (result: XrayResult | null) => void;
  setPreviewUrl: (url: string | null) => void;
  clearXray: () => void;
}

const XrayContext = createContext<XrayContextType | undefined>(undefined);

export function XrayProvider({ children }: { children: ReactNode }) {
  const [imagingProbability, setImagingProbability] = useState(0);
  const [imagingConfidence, setImagingConfidence] = useState(0);
  const [xrayResult, setXrayResult] = useState<XrayResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setXrayResults = (probability: number, confidence: number) => {
    setImagingProbability(probability);
    setImagingConfidence(confidence);
  };

  const clearXray = () => {
    setImagingProbability(0);
    setImagingConfidence(0);
    setXrayResult(null);
    setPreviewUrl(null);
  };

  return (
    <XrayContext.Provider value={{ 
      imagingProbability, 
      imagingConfidence, 
      xrayResult,
      previewUrl,
      setXrayResults,
      setXrayResult,
      setPreviewUrl,
      clearXray
    }}>
      {children}
    </XrayContext.Provider>
  );
}

export function useXrayContext() {
  const context = useContext(XrayContext);
  if (context === undefined) {
    throw new Error("useXrayContext must be used within an XrayProvider");
  }
  return context;
}
