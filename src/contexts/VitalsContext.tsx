"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VitalsData {
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

interface VitalsContextType {
  vitals: VitalsData;
  setVitals: (vitals: VitalsData) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export function VitalsProvider({ children }: { children: ReactNode }) {
  const [vitals, setVitals] = useState<VitalsData>({
    Temperature_C: 38.2,
    Temperature_trend: 0.7,
    SpO2_percent: 92,
    SpO2_trend: -2.5,
    HeartRate_bpm: 130,
    HeartRate_trend: 10,
    RespRate_bpm: 38,
    RespRate_trend: 8,
    Cough: 1,
    Retractions: 1,
  });

  return (
    <VitalsContext.Provider value={{ vitals, setVitals }}>
      {children}
    </VitalsContext.Provider>
  );
}

export function useVitalsContext() {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error("useVitalsContext must be used within a VitalsProvider");
  }
  return context;
}
