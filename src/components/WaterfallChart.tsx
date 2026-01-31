"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaterfallFeature {
  feature: string;
  value: number;
  start: number;
  end: number;
}

interface WaterfallData {
  base_value: number;
  expected_value: number;
  features: WaterfallFeature[];
  final_value: number;
}

interface WaterfallChartProps {
  data: WaterfallData;
}

export default function WaterfallChart({ data }: WaterfallChartProps) {
  // Calculate chart dimensions
  const minValue = Math.min(
    data.base_value,
    ...data.features.map(f => Math.min(f.start, f.end)),
    0
  );
  const maxValue = Math.max(
    data.base_value,
    ...data.features.map(f => Math.max(f.start, f.end)),
    1
  );
  
  const range = maxValue - minValue;
  const padding = range * 0.1;
  
  const getYPosition = (value: number) => {
    return ((maxValue + padding - value) / (range + 2 * padding)) * 100;
  };
  
  const getHeight = (start: number, end: number) => {
    return Math.abs((end - start) / (range + 2 * padding)) * 100;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-teal-200">
      <h3 className="text-lg font-bold text-teal-900 mb-4">SHAP Waterfall Analysis</h3>
      <p className="text-xs text-teal-700 mb-6">
        Shows how each feature contributes to the final risk prediction
      </p>
      
      <div className="relative h-96 bg-gradient-to-b from-teal-50 to-white rounded-xl p-4 border border-teal-100">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-teal-600 font-mono">
          <span>{maxValue.toFixed(2)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(2)}</span>
          <span>{minValue.toFixed(2)}</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-14 relative h-full">
          {/* Base value */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute w-16"
            style={{ 
              left: '0%',
              top: `${getYPosition(data.base_value)}%`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="bg-gray-400 h-12 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">Base</span>
            </div>
            <div className="text-[10px] text-center mt-1 text-gray-600 font-mono">
              {data.base_value.toFixed(3)}
            </div>
          </motion.div>
          
          {/* Feature contributions */}
          {data.features.map((feature, index) => {
            const xPosition = ((index + 1) / (data.features.length + 2)) * 100;
            const isPositive = feature.value > 0;
            const barHeight = getHeight(feature.start, feature.end);
            const yPos = getYPosition(Math.max(feature.start, feature.end));
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="absolute"
                style={{
                  left: `${xPosition}%`,
                  top: `${yPos}%`,
                  width: '60px',
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Connector line from previous */}
                {index > 0 && (
                  <div
                    className="absolute border-t-2 border-dashed border-teal-300"
                    style={{
                      width: `${100 / (data.features.length + 2) * 100}px`,
                      right: '30px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                )}
                
                {/* Bar */}
                <div
                  className={cn(
                    "rounded-lg flex items-center justify-center transition-all hover:shadow-lg",
                    isPositive ? "bg-red-500" : "bg-green-500"
                  )}
                  style={{ height: `${Math.max(barHeight, 8)}%` }}
                >
                  <span className="text-[10px] font-bold text-white px-1 text-center leading-tight">
                    {feature.feature}
                  </span>
                </div>
                
                {/* Value label */}
                <div className={cn(
                  "text-[10px] text-center mt-1 font-mono font-bold",
                  isPositive ? "text-red-600" : "text-green-600"
                )}>
                  {isPositive ? '+' : ''}{feature.value.toFixed(3)}
                </div>
              </motion.div>
            );
          })}
          
          {/* Final value */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: data.features.length * 0.1 }}
            className="absolute w-16"
            style={{ 
              left: '100%',
              top: `${getYPosition(data.final_value)}%`,
              transform: 'translate(-100%, -50%)'
            }}
          >
            <div className="bg-indigo-600 h-12 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">Final</span>
            </div>
            <div className="text-[10px] text-center mt-1 text-indigo-900 font-mono font-bold">
              {data.final_value.toFixed(3)}
            </div>
          </motion.div>
          
          {/* Reference line at 0.5 */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-gray-400"
            style={{ top: `${getYPosition(0.5)}%` }}
          >
            <span className="absolute -left-12 -top-2 text-[10px] text-gray-500">0.50</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">Increases risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">Decreases risk</span>
        </div>
      </div>
    </div>
  );
}
