"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface XrayContextType {
  imagingProbability: number;
  imagingConfidence: number;
  setXrayResults: (probability: number, confidence: number) => void;
}

const XrayContext = createContext<XrayContextType | undefined>(undefined);

export function XrayProvider({ children }: { children: ReactNode }) {
  const [imagingProbability, setImagingProbability] = useState(0);
  const [imagingConfidence, setImagingConfidence] = useState(0);

  const setXrayResults = (probability: number, confidence: number) => {
    setImagingProbability(probability);
    setImagingConfidence(confidence);
  };

  return (
    <XrayContext.Provider value={{ imagingProbability, imagingConfidence, setXrayResults }}>
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
